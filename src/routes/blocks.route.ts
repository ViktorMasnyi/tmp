import type { FastifyRequest, FastifyReply } from 'fastify';
import { blocksService } from "../services/blocks.service.ts";
import type { Block } from '../types/types.ts';
import blocksSchema from "../schemas/blocks.schema.ts";

export async function blocksRoutes(fastify: any) {
    const pool = fastify.db.pool
    fastify.post('/blocks',
        {schema: blocksSchema},
        async function (request: FastifyRequest, reply: FastifyReply) {
            try {
                const block = request.body as Block;

                await blocksService.addBlock(pool, block);

                return  reply.code(201).send({ message: 'Block added successfully' });
            } catch(err: any) {
                if (err.message === 'Invalid block height') {
                    return reply.code(400).send({ error: err.message });
                }

                throw new Error(err);
            }
        });
}
