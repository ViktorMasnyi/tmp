import Fastify from 'fastify';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import dbConnector from './db/db';
import routes from "./routes";

process.env.DATABASE_URL = 'postgres://myuser:mypassword@localhost:5432/mydatabase';

const fastify = Fastify({ logger: true });

fastify.register(dbConnector)

routes.map((route) => {
    fastify.register(route);
})

fastify.get('/', async () => {
  return { hello: 'world' };
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

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    const pool = new Pool({
        connectionString: databaseUrl
    });

    await createTables(pool);
    await testPostgres(pool);

    await pool.end();
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
}
