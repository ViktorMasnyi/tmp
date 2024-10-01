import type { FastifyReply, FastifyRequest } from 'fastify';
import { blocksService } from "../../services/blocks.service.ts";
import type { Block } from '../../types/types.ts';
import { blocksRoutes } from '../blocks.route.ts';

jest.mock("../../services/blocks.service.ts");

describe('blocksRoutes() blocksRoutes method', () => {
    let fastify: any;
    let request: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        fastify = {
            db: {
                pool: {}
            },
            post: jest.fn()
        };

        request = {
            body: {}
        } as FastifyRequest;

        reply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as FastifyReply;
    });

    describe('Happy Path', () => {
        it('should add a block successfully and return a 201 status code', async () => {
            const block: Block = { id: '123', height: 1, transactions: [] };
            request.body = block;
            (blocksService.addBlock as jest.Mock).mockResolvedValueOnce(undefined);

            await blocksRoutes(fastify);
            const postHandler = fastify.post.mock.calls[0][2];
            await postHandler(request, reply);

            expect(blocksService.addBlock).toHaveBeenCalledWith(fastify.db.pool, block);
            expect(reply.code).toHaveBeenCalledWith(201);
            expect(reply.send).toHaveBeenCalledWith({ message: 'Block added successfully' });
        });
    });

    describe('Edge Cases', () => {
        it('should return a 400 status code when a UserError is thrown', async () => {
            const block: Block = { id: '123', height: 1, transactions: [] };
            request.body = block;
            const error = new Error('Invalid block data');
            error.name = 'UserError';
            (blocksService.addBlock as jest.Mock).mockRejectedValueOnce(error);

            await blocksRoutes(fastify);
            const postHandler = fastify.post.mock.calls[0][2];
            await postHandler(request, reply);

            expect(reply.code).toHaveBeenCalledWith(400);
            expect(reply.send).toHaveBeenCalledWith({ error: 'Invalid block data' });
        });

        it('should throw an error for unexpected exceptions', async () => {
            const block: Block = { id: '123', height: 1, transactions: [] };
            request.body = block;
            const error = new Error('Unexpected error');
            (blocksService.addBlock as jest.Mock).mockRejectedValueOnce(error);

            await blocksRoutes(fastify);
            const postHandler = fastify.post.mock.calls[0][2];
            await expect(postHandler(request, reply)).rejects.toThrow('Unexpected error');
        });
    });
});
