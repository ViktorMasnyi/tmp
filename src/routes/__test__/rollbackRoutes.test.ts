import { FastifyReply, FastifyRequest } from 'fastify';
import { rollbackService } from "../../services/rollback.service.ts";
import { rollbackRoutes } from '../rollback.route.ts';

jest.mock("../../services/rollback.service.ts");

describe('rollbackRoutes() rollbackRoutes method', () => {
    let fastifyMock: any;
    let requestMock: FastifyRequest;
    let replyMock: FastifyReply;

    beforeEach(() => {
        fastifyMock = {
            db: {
                pool: {}
            },
            post: jest.fn()
        };

        requestMock = {
            query: {
                height: 0
            }
        } as FastifyRequest;

        replyMock = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as FastifyReply;
    });

    describe('Happy Path', () => {
        it('should return a success message when rollback affects no transactions', async () => {
            // @ts-expect-error
            requestMock.query.height = 100;
            (rollbackService.rollBack as jest.Mock).mockResolvedValue(0);

            await rollbackRoutes(fastifyMock);
            const postHandler = fastifyMock.post.mock.calls[0][2];
            await postHandler(requestMock, replyMock);

            expect(replyMock.code).toHaveBeenCalledWith(200);
            expect(replyMock.send).toHaveBeenCalledWith({ message: 'Rollback successful, no transactions were affected' });
        });

        it('should return a success message when rollback affects some transactions', async () => {
            // @ts-expect-error
            requestMock.query.height = 100;
            (rollbackService.rollBack as jest.Mock).mockResolvedValue(5);

            await rollbackRoutes(fastifyMock);
            const postHandler = fastifyMock.post.mock.calls[0][2];
            await postHandler(requestMock, replyMock);

            expect(replyMock.send).toHaveBeenCalledWith({ message: 'Rollback successful' });
        });
    });

    describe('Edge Cases', () => {
        it('should handle errors thrown by rollbackService', async () => {
            // @ts-expect-error
            requestMock.query.height = 100;
            const errorMessage = 'Database error';
            (rollbackService.rollBack as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await rollbackRoutes(fastifyMock);
            const postHandler = fastifyMock.post.mock.calls[0][2];
            await expect(postHandler(requestMock, replyMock)).rejects.toThrow(errorMessage);
        });

        it('should handle non-numeric height gracefully', async () => {
            // @ts-expect-error
            requestMock.query.height = NaN;
            (rollbackService.rollBack as jest.Mock).mockResolvedValue(0);

            await rollbackRoutes(fastifyMock);
            const postHandler = fastifyMock.post.mock.calls[0][2];
            await postHandler(requestMock, replyMock);

            expect(replyMock.code).toHaveBeenCalledWith(200);
            expect(replyMock.send).toHaveBeenCalledWith({ message: 'Rollback successful, no transactions were affected' });
        });
    });
});
