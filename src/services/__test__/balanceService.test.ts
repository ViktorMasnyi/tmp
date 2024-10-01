import { Pool } from "pg";
import { balanceService } from '../balance.service.ts';

jest.mock("pg", () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('balanceService() balanceService method', () => {
    let dbPool: Pool;

    beforeEach(() => {
        dbPool = new Pool();
    });

    describe("Happy Path", () => {
        it("should return transactions for a valid address", async () => {
            const mockResponse = { rows: [{ id: 1, address: "validAddress", amount: 100 }] };
            (dbPool.query as jest.Mock).mockResolvedValueOnce(mockResponse);

            const result = await balanceService.getBalance(dbPool, "validAddress");

            expect(dbPool.query).toHaveBeenCalledWith(expect.any(String), ["validAddress"]);
            expect(result).toEqual(mockResponse);
        });
    });

    describe("Edge Cases", () => {
        it("should handle an empty address gracefully", async () => {
            const mockResponse = { rows: [] };
            (dbPool.query as jest.Mock).mockResolvedValueOnce(mockResponse);

            const result = await balanceService.getBalance(dbPool, "");

            expect(dbPool.query).toHaveBeenCalledWith(expect.any(String), [""]);
            expect(result).toEqual(mockResponse);
        });

        it("should handle a non-existent address gracefully", async () => {
            const mockResponse = { rows: [] };
            (dbPool.query as jest.Mock).mockResolvedValueOnce(mockResponse);

            const result = await balanceService.getBalance(dbPool, "nonExistentAddress");

            expect(dbPool.query).toHaveBeenCalledWith(expect.any(String), ["nonExistentAddress"]);
            expect(result).toEqual(mockResponse);
        });

        it("should handle database query errors gracefully", async () => {
            const mockError = new Error("Database error");
            (dbPool.query as jest.Mock).mockRejectedValueOnce(mockError);

            await expect(balanceService.getBalance(dbPool, "anyAddress")).rejects.toThrow("Database error");
        });
    });
});
