import { Pool } from "pg";
import type { Block, Transaction } from "../types/types.ts";


export const blocksService = {
    addBlock: async (dbPool: Pool, block: Block, ) => {
        const { id: blockId, height, transactions } = block;

        const handleTransaction = async (transaction: Transaction, pool: Pool) => {
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

        for (const transaction of transactions) {
            await handleTransaction(transaction, dbPool);
        }
    }
}
