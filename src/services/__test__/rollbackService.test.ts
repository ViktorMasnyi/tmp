import { Pool } from "pg";
import { rollbackService } from '../rollback.service.ts';

jest.mock("pg", () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('rollbackService() rollbackService method', () => {
    let dbPool: Pool;

    beforeEach(() => {
        dbPool = new Pool();
        jest.clearAllMocks();
    });

    describe("Happy Path", () => {
        it("should commit transaction and return the number of rows deleted when height is valid", async () => {
            const height = 10;
            const expectedRowCount = 5;
            (dbPool.query as jest.Mock).mockResolvedValueOnce({}) // For start transaction
                .mockResolvedValueOnce({}) // For update query
                .mockResolvedValueOnce({ rowCount: expectedRowCount }) // For delete query
                .mockResolvedValueOnce({}); // For commit

            const result = await rollbackService.rollBack(dbPool, height);

            expect(dbPool.query).toHaveBeenCalledTimes(4);
            expect(dbPool.query).toHaveBeenCalledWith(`start transaction;`);
            expect(dbPool.query).toHaveBeenCalledWith(`
                UPDATE transactions
                SET isconsumed = FALSE
                WHERE height = $1;
            `, [height]);
            expect(dbPool.query).toHaveBeenCalledWith(`
                DELETE
                FROM transactions
                WHERE height > $1;
            `, [height]);
            expect(dbPool.query).toHaveBeenCalledWith(`commit;`);
            expect(result).toBe(expectedRowCount);
        });
    });

    describe("Edge Cases", () => {
        it("should rollback transaction and throw an error if update query fails", async () => {
            const height = 10;
            const errorMessage = "Update query failed";
            (dbPool.query as jest.Mock).mockResolvedValueOnce({}) // For start transaction
                .mockRejectedValueOnce(new Error(errorMessage)); // For update query

            await expect(rollbackService.rollBack(dbPool, height)).rejects.toThrow(errorMessage);
            expect(dbPool.query).toHaveBeenCalledTimes(3);
            expect(dbPool.query).toHaveBeenCalledWith(`start transaction;`);
            expect(dbPool.query).toHaveBeenCalledWith(`
                UPDATE transactions
                SET isconsumed = FALSE
                WHERE height = $1;
            `, [height]);
            expect(dbPool.query).toHaveBeenCalledWith(`rollback;`);
        });

        it("should rollback transaction and throw an error if delete query fails", async () => {
            const height = 10;
            const errorMessage = "Delete query failed";
            (dbPool.query as jest.Mock).mockResolvedValueOnce({}) // For start transaction
                .mockResolvedValueOnce({}) // For update query
                .mockRejectedValueOnce(new Error(errorMessage)); // For delete query

            await expect(rollbackService.rollBack(dbPool, height)).rejects.toThrow(errorMessage);
            expect(dbPool.query).toHaveBeenCalledTimes(4);
            expect(dbPool.query).toHaveBeenCalledWith(`start transaction;`);
            expect(dbPool.query).toHaveBeenCalledWith(`
                UPDATE transactions
                SET isconsumed = FALSE
                WHERE height = $1;
            `, [height]);
            expect(dbPool.query).toHaveBeenCalledWith(`
                DELETE
                FROM transactions
                WHERE height > $1;
            `, [height]);
            expect(dbPool.query).toHaveBeenCalledWith(`rollback;`);
        });

        it("should return 0 if no rows are deleted", async () => {
            const height = 10;
            (dbPool.query as jest.Mock).mockResolvedValueOnce({}) // For start transaction
                .mockResolvedValueOnce({}) // For update query
                .mockResolvedValueOnce({ rowCount: 0 }) // For delete query
                .mockResolvedValueOnce({}); // For commit

            const result = await rollbackService.rollBack(dbPool, height);

            expect(dbPool.query).toHaveBeenCalledTimes(4);
            expect(result).toBe(0);
        });
    });
});
