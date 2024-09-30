import { Pool } from "pg";

export const rollbackService = {
    rollBack: async (dbPool: Pool, height: number, ) => {
        let rowCount = 0;

        try {
            await dbPool.query(`start transaction;`);
            await dbPool.query(`
                UPDATE transactions
                SET isconsumed = FALSE
                WHERE height = $1;
            `, [height]);

            const data = await dbPool.query(`
                DELETE
                FROM transactions
                WHERE height > $1;
            `, [height]);

            rowCount = data.rowCount ? data.rowCount : 0;

            await dbPool.query(`commit;`);
        } catch (e) {
            await dbPool.query(`rollback;`);

            throw e;

        }

        return rowCount;
    }
}
