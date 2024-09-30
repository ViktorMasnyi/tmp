import { Pool } from 'pg';
import fastifyPlugin from 'fastify-plugin';

async function dbConnector(fastify: any) {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        console.log("db connected successfully")
        fastify.decorate('db', { pool })
    } catch(err) {
        console.error(err)
    }
}

export default fastifyPlugin(dbConnector);

