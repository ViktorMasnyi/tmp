import Fastify from 'fastify';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

type Output = {
    address: string;
    value: number;
}

type Input = {
    txId: string;
    index: number;
}

type Transaction = {
    id: string;
    inputs: Array<Input>
    outputs: Array<Output>
}

type Block = {
    id: string;
    height: number;
    transactions: Array<Transaction>;
}

process.env.DATABASE_URL = 'postgres://myuser:mypassword@localhost:5432/mydatabase';

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
});

fastify.get('/balance/:address', async (request, reply) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    const { address } = request.params;
    const { rows } = await pool.query(`
        SELECT * FROM transactions WHERE address = $1;
    `, [address]);

    if (rows.length === 0) {
        return reply.code(404).send({ error: 'Address not found' });
    }

    return  reply.send(rows[0].isconsumed ? 0 : rows[0].value);

});

fastify.post('/rollback', async (request, reply) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    const { height } = request.query;
    console.log('====height', height);

    await pool.query(`
        UPDATE transactions
        SET isconsumed = FALSE
        WHERE height = $1;
    `, [height]);

    await pool.query(`
        DELETE FROM transactions WHERE height > $1;
    `, [height]);
    return reply.send({ message: 'Rollback successful' });
});

fastify.post('/blocks', async (request, reply) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    const { id: blockId, height, transactions } = request.body as Block;

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
        await handleTransaction(transaction, pool);
    }

    // const { id: transactionId, outputs, inputs } = transactions[0];





    // writhe the query to find the transaction where height is equal to the current height - 1

    const { rows } = await pool.query(`
        SELECT * FROM transactions WHERE height = $1;
    `, [height - 1]);

    // await pool.query(`
    //     INSERT INTO transactions (address, txid, height, value)
    //     VALUES ($1, $2, $3, $4);
    // `, [address, txId, height, value]);
});

async function testPostgres(pool: Pool) {
    const id = randomUUID();
    const name = 'Satoshi';
    const email = 'Nakamoto';

    await pool.query(`DELETE FROM users;`);

    await pool.query(`
        INSERT INTO users (id, name, email)
        VALUES ($1, $2, $3);
    `, [id, name, email]);

    const { rows } = await pool.query(`
        SELECT * FROM users;
    `);

    console.log('USERS', rows);
}

async function createTables(pool: Pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
                                                    address VARCHAR(63) PRIMARY KEY,
                                                    txId VARCHAR(32),
                                                    height INT,
                                                    value INT,
                                                    index INT,
                                                    isConsumed BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_height ON transactions (height);
    `);
}

async function bootstrap() {
    console.log('Bootstrapping...');
    const databaseUrl = process.env.DATABASE_URL;
    console.log('====databaseUrl', databaseUrl);
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    const pool = new Pool({
        connectionString: databaseUrl
    });

    await createTables(pool);
    // await testPostgres(pool);
}

try {
    await bootstrap();
    await fastify.listen({
        port: 3000,
        host: '0.0.0.0'
    })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
};
