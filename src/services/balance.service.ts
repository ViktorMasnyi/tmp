import { Pool } from "pg";

export const balanceService = {
    getBalance: async (dbPool: Pool, address: string) => {

        return dbPool.query(`
            SELECT * FROM transactions WHERE address = $1;
        `, [address]);
    }
}
