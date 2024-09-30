import { Pool } from "pg";

export const rollbackService = {
    rollBack: async (dbPool: Pool, height: number, ) => {
        await dbPool.query(`
            UPDATE transactions
            SET isconsumed = FALSE
            WHERE height = $1;
        `, [height]);

        const { rowCount } = await dbPool.query(`
            DELETE FROM transactions WHERE height > $1;
        `, [height]);

        console.log('====rowCount', rowCount);

        return rowCount;
    }
}
