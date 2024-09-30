import { Pool } from "pg";
import type { Block, Transaction } from "../types/types.ts";
import { subtle } from 'crypto';

const handleTransaction = async (height: number, transaction: Transaction, pool: Pool): Promise<void> => {
    const { id: transactionId, outputs, inputs } = transaction;
    // one transaction can have only one input
    if  (inputs.length) {
        const input = inputs[0];
        const { txId, index } = input;
        // find the transaction that has the txId and index
        const { rows } = await pool.query(`
                SELECT * FROM transactions WHERE txId = $1 AND index = $2;
            `, [txId, index]);
        if (rows.length === 1) {
            await pool.query(`
                    UPDATE transactions
                    SET isConsumed = TRUE
                    WHERE txId = $1 AND index = $2;
                `, [txId, index]);
        } else {
            throw new Error(`Valid input not found: txId: ${txId} index: ${index}`);
        }

    }

    for (const i in outputs) {
        const { address, value } = outputs[i];
        await pool.query(`
                INSERT INTO transactions (address, txid, height, value, index)
                VALUES ($1, $2, $3, $4, $5);
            `, [address, transactionId, height, value, i]);
    }
};

const getCurrentHeight = async (pool: Pool): Promise<number> => {
    const { rows } = await pool.query(`
            SELECT MAX(height) as height FROM transactions;
        `);

    return rows[0].height || 0;
};

const calculateSum = (transactions: Transaction[], type: 'inputs' | 'outputs'): number => {
    return transactions.reduce((sum, transaction) => {
        return sum + transaction[type].reduce((innerSum, item) => innerSum + item.value, 0);
    }, 0);
};

const calculateBlockId = async (height: number, transactions: Transaction[]): Promise<string> => {
    const data = height + transactions.map(tx => tx.id).join('');
    const encoder = new TextEncoder();
    const hashBuffer = await subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const blocksService = {
    addBlock: async (dbPool: Pool, block: Block, ) => {
        const { id: blockId, height, transactions } = block;

        const currentHeight = await getCurrentHeight(dbPool);

        if (block.height !== currentHeight + 1) {
            throw new Error('Invalid block height'); // Todo: introduce a custom error with a type, track it in the route handler
        }

        const inputValue = await dbPool.query(`
            SELECT value FROM transactions WHERE txId = $1 AND index = $2;
        `, [transactions[0].inputs?.[0]?.txId, transactions[0].inputs?.[0]?.index]);

        // const inputSum = calculateSum(transactions, 'inputs');
        const outputSum = calculateSum(transactions, 'outputs');
        const inputSum = inputValue.rows?.[0]?.value;

        console.log('====inputSum', typeof inputSum);

        if (typeof inputSum !== 'undefined' && inputSum !== outputSum) {
            throw new Error('Sum of input values does not match sum of output values');
        }

        const expectedBlockId = await calculateBlockId(height, transactions);
        console.log('====blockId', blockId);
        console.log('====expectedBlockId', expectedBlockId);
        if (blockId !== expectedBlockId) {
            throw new Error('Invalid block ID');
        }

        try {
            await dbPool.query(`start transaction;`);

            for (const transaction of transactions) {
                await handleTransaction(height, transaction, dbPool);
            }

            await dbPool.query(`commit;`);
        } catch (e) {
            await dbPool.query(`rollback;`);

            throw e;
        }
    }
}
