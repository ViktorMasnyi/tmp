
import { Pool } from "pg";
import type { Block } from "../../types/types.ts";
import { blocksService } from '../blocks.service.ts';
import { UserError } from "../errors.ts";

jest.mock("pg", () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('blocksService() blocksService method', () => {
    let dbPool: any;

    beforeEach(() => {
        dbPool = new Pool();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Happy Path", () => {
        it("should successfully add a block with valid transactions", async () => {
            const block: Block = {
                id: "b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192",
                height: 2,
                transactions: [
                    {
                        id: "tx1",
                        inputs: [{ txId: "prevTx", index: 0 }],
                        outputs: [{ address: "address1", value: 100 }],
                    },
                ],
            };

            dbPool.query
                .mockResolvedValueOnce({ rows: [{ height: 1 }] }) // getCurrentHeight
                .mockResolvedValueOnce({ rows: [{ value: 100 }] }) // inputValue
                .mockResolvedValueOnce({ rowCount: 1 }) // handleTransaction input update
                .mockResolvedValueOnce({}); // handleTransaction output insert

            await blocksService.addBlock(dbPool, block);

            expect(dbPool.query).toHaveBeenCalledTimes(6);
            expect(dbPool.query).toHaveBeenCalledWith(`start transaction;`);
            expect(dbPool.query).toHaveBeenCalledWith(`commit;`);
        });
    });

    describe("Edge Cases", () => {
        it("should throw an error if block height is invalid", async () => {
            const block: Block = {
                id: "b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192",
                height: 3,
                transactions: [],
            };

            dbPool.query.mockResolvedValueOnce({ rows: [{ height: 1 }] }); // getCurrentHeight

            await expect(blocksService.addBlock(dbPool, block)).rejects.toThrow(UserError);
            expect(dbPool.query).toHaveBeenCalledTimes(1);
        });

        it("should throw an error if input value does not match output sum", async () => {
            const block: Block = {
                id: "b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192",
                height: 2,
                transactions: [
                    {
                        id: "tx1",
                        inputs: [{ txId: "prevTx", index: 0 }],
                        outputs: [{ address: "address1", value: 100 }],
                    },
                ],
            };

            dbPool.query
                .mockResolvedValueOnce({ rows: [{ height: 1 }] }) // getCurrentHeight
                .mockResolvedValueOnce({ rows: [{ value: 50 }] }); // inputValue

            await expect(blocksService.addBlock(dbPool, block)).rejects.toThrow(UserError);
            expect(dbPool.query).toHaveBeenCalledTimes(2);
        });

        it("should throw an error if block ID is invalid", async () => {
            const block: Block = {
                id: "invalidBlockId",
                height: 2,
                transactions: [
                    {
                        id: "tx1",
                        inputs: [{ txId: "prevTx", index: 0 }],
                        outputs: [{ address: "address1", value: 100 }],
                    },
                ],
            };

            dbPool.query
                .mockResolvedValueOnce({ rows: [{ height: 1 }] }) // getCurrentHeight
                .mockResolvedValueOnce({ rows: [{ value: 100 }] }) // inputValue
                .mockResolvedValueOnce({ rowCount: 1 }) // handleTransaction input update
                .mockResolvedValueOnce({}); // handleTransaction output insert

            await expect(blocksService.addBlock(dbPool, block)).rejects.toThrow(UserError);
            expect(dbPool.query).toHaveBeenCalledTimes(2);
        });

        it("should throw if an error occurs during processing", async () => {
            const block: Block = {
                id: "b68c0cfb1305c636d83f28b7c033e26a155aabf427ccb25ee6d551a139908192",
                height: 2,
                transactions: [
                    {
                        id: "tx1",
                        inputs: [{ txId: "prevTx", index: 0 }],
                        outputs: [{ address: "address1", value: 100 }],
                    },
                ],
            };

            dbPool.query
                .mockResolvedValueOnce({ rows: [{ height: 1 }] }) // getCurrentHeight
                .mockResolvedValueOnce({ rows: [{ value: 100 }] }) // inputValue
                .mockRejectedValueOnce(new Error("DB Error")); // simulate error during transaction

            await expect(blocksService.addBlock(dbPool, block)).rejects.toThrow(Error);
        });
    });
});
