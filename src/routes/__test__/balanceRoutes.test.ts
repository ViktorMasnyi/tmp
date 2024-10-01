import type { FastifyReply, FastifyRequest } from 'fastify';
import { balanceService } from '../../services/balance.service.ts';
import { balanceRoutes } from '../balance.route.ts';

jest.mock("../../services/balance.service.ts");

describe('balanceRoutes() balanceRoutes method', () => {
    let fastifyMock: any;
    let requestMock: FastifyRequest;
    let replyMock: FastifyReply;

    beforeEach(() => {
        fastifyMock = {
            db: {
                pool: {}
            },
            get: jest.fn()
        };

        requestMock = {
            params: {
                address: 'testAddress'
            }
        } as unknown as FastifyRequest;

        replyMock = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as FastifyReply;
    });

    describe('Happy Path', () => {
        it('should return the balance value when address is found and not consumed', async () => {
            const mockRows = [{ isconsumed: false, value: 100 }];
            (balanceService.getBalance as jest.Mock).mockResolvedValue({ rows: mockRows });

            await balanceRoutes(fastifyMock);
            const routeHandler = fastifyMock.get.mock.calls[0][2];
            await routeHandler(requestMock, replyMock);

            expect(replyMock.send).toHaveBeenCalledWith(100);
        });

        it('should return 0 when address is found and is consumed', async () => {
            const mockRows = [{ isconsumed: true, value: 100 }];
            (balanceService.getBalance as jest.Mock).mockResolvedValue({ rows: mockRows });

            await balanceRoutes(fastifyMock);
            const routeHandler = fastifyMock.get.mock.calls[0][2];
            await routeHandler(requestMock, replyMock);

            expect(replyMock.send).toHaveBeenCalledWith(0);
        });
    });

    describe('Edge Cases', () => {
        it('should return 404 when address is not found', async () => {
            const mockRows: any[] = [];
            (balanceService.getBalance as jest.Mock).mockResolvedValue({ rows: mockRows });

            await balanceRoutes(fastifyMock);
            const routeHandler = fastifyMock.get.mock.calls[0][2];
            await routeHandler(requestMock, replyMock);

            expect(replyMock.code).toHaveBeenCalledWith(404);
            expect(replyMock.send).toHaveBeenCalledWith({ error: 'Address not found' });
        });

        it('should throw an error when balanceService throws an error', async () => {
            const errorMessage = 'Database error';
            (balanceService.getBalance as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await balanceRoutes(fastifyMock);
            const routeHandler = fastifyMock.get.mock.calls[0][2];
            await expect(routeHandler(requestMock, replyMock)).rejects.toThrow(errorMessage);
        });
    });
});
