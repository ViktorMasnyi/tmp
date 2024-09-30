import type { FastifyRequest, FastifyReply } from 'fastify';
import {balanceService} from '../services/balance.service.ts'
import balanceSchema from '../schemas/balance.schema.ts'

export async function balanceRoutes(fastify: any) {
    const pool = fastify.db.pool
    fastify.get('/balance/:address',
        {schema: balanceSchema},
        async function (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) {
        try {
            const { address } = request.params;
            const { rows } = await balanceService.getBalance(pool, address)

            if (rows.length === 0) {
                return reply.code(404).send({ error: 'Address not found' });
            }

            return  reply.send(rows[0].isconsumed ? 0 : rows[0].value);
        } catch(err: any) {
            throw new Error(err);
        }
    });
}
