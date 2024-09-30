import type { FastifyRequest, FastifyReply } from 'fastify';
import { blocksService } from "../services/blocks.service.ts";
import type { Block } from '../types/types.ts';

export async function blocksRoutes(fastify: any) {
    const pool = fastify.db.pool
    fastify.post('/blocks',
        // {schema: allTodos},
        async function (request: FastifyRequest, reply: FastifyReply) {
            try {
                const block = request.body as Block;

                await blocksService.addBlock(pool, block)

                return  reply.code(201).send({ message: 'Block added successfully' });
            } catch(err: any) {
                throw new Error(err);
            }
        });
}
