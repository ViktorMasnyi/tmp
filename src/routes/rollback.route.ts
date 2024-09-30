import type { FastifyRequest, FastifyReply } from 'fastify';
import {rollbackService} from "../services/rollback.service.ts";
import rollBackSchema from "../schemas/rollback.schema.ts";

export async function rollbackRoutes(fastify: any) {
    const pool = fastify.db.pool;

    fastify.post('/rollback',
        {schema: rollBackSchema},
        async function (request: FastifyRequest<{ Querystring: { height: number } }>, reply: FastifyReply) {
            try {
                const { height } = request.query;
                const rowsAffected = await rollbackService.rollBack(pool, height)

                if (rowsAffected === 0) {
                    return reply.code(200).send({ message: 'Rollback successful, no transactions were affected' });
                }

                return reply.send({ message: 'Rollback successful' });
            } catch(err: any) {
                throw new Error(err);
            }
        });
}
