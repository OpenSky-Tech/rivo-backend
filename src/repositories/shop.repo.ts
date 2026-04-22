import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class ShopRepo {
    constructor(@inject(TYPES.DbPool) private db: Pool) { }

    public async getShops({ limit, offset, search }: { limit: number, offset: number, search: string }) {

        let where = "WHERE 1=1";
        let values = [];
        let index = 1;

        if (search) {
            where += ` AND name ILIKE $${index}`;
            values.push(`%${search}%`);
            index++;
        }

        const countQuery = {
            text: `
            SELECT COUNT(*) as count
            FROM shops
            ${where}
            `,
            values: [...values],
        };

        const countRes = await this.db.query(countQuery);
        const count = Number(countRes.rows[0].count);

        values.push(limit, offset);
        const limitIndex = index;
        const offsetIndex = index + 1;

        const query = `
            SELECT *
            FROM shops
            ${where}
            LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;

        const { rows } = await this.db.query(query, [...values]);

        return { list: rows, total: count };
    }

    public async getShopById(id: any) {
        const query = `
            SELECT *,
            shop_phone as "shopPhone",
            created_at as "createdAt",
            updated_at as "updatedAt"
            FROM shops
            WHERE id = $1
        `;

        const { rows } = await this.db.query(query, [id]);

        return rows[0];
    }

    public async createShop(body: any) {
        const query = `
            INSERT INTO shops (owner_id, name, phone, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, owner_id, name, phone, status, created_at as "createdAt"
        `;

        const { rows } = await this.db.query(query, [
            body.ownerid,
            body.name,
            body.phone,
            body.status
        ]);

        return rows[0];
    }

    public async updateShop(id: any, body: any) {
        const query = `
            UPDATE shops
            SET name = $1,
                address = $2,
                shop_phone = $3,
                status = $4,
                updated_at = now()
            WHERE id = $5
            RETURNING id, name, address, shop_phone as "shopPhone", status, created_at as "createdAt", updated_at as "updatedAt"
        `;

        const { rows } = await this.db.query(query, [
            body.name,
            body.address,
            body.shopPhone,
            body.status,
            id
        ]);

        return rows[0];
    }

    public async deleteShop(id: any) {
        const query = `
            DELETE FROM shops
            WHERE id = $1
        `;

        await this.db.query(query, [id]);
    }

    public async shopInUse(id: any) {

        const query = `
            SELECT * FROM products
            WHERE shop_id = $1
        `;

        const { rows } = await this.db.query(query, [id]);

        return rows.length > 0;
    }
}