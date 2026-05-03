import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class CategoryRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

  public async getCategories(params: any) {
    const { limit, offset, name, shopid } = params;

    let where = "WHERE 1=1";
    let values = [];
    let index = 1;

    if (name) {
      where += ` AND c.name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    if (shopid) {
      where += ` AND c.shop_id = $${index++}`;
      values.push(shopid);
    }

    const countQuery = {
      text: `
            SELECT COUNT(*) as count
            FROM categories as c
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
            SELECT c.*,
            s.name as shopname
            FROM categories as c
            LEFT JOIN shops as s
            ON s.id = c.shop_id
            ${where}
            LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;

    const { rows } = await this.db.query(query, [...values]);

    return { list: rows, total: count };
  }

  public async getCategoryById(id: any) {
    const query = `
            SELECT c.*,
            s.name as shopname
            FROM categories as c
            LEFT JOIN shops as s
                ON s.id = c.shop_id
            WHERE c.id = $1
        `;

    const { rows } = await this.db.query(query, [id]);

    return rows[0];
  }

  public async createCategory(body: any) {
    const query = `
            INSERT INTO categories (shop_id, parent_id, name)
            VALUES ($1, $2, $3)
            RETURNING id, shop_id, parent_id, name, created_at as "createdAt"
        `;

    const { rows } = await this.db.query(query, [
      body.shopid,
      body.parentid ?? null,
      body.name,
    ]);

    return rows[0];
  }

  public async updateCategory(id: any, body: any) {
    const query = `
            UPDATE categories
            SET shop_id = $1,
                parent_id = $2,
                name = $3,
                updated_at = now()
            WHERE id = $4
            RETURNING id, shop_id, parent_id, name, created_at as "createdAt", updated_at as "updatedAt"
        `;

    const { rows } = await this.db.query(query, [
      body.shopid,
      body.parentid,
      body.name,
      id,
    ]);

    return rows[0];
  }

  public async deleteCategory(id: any) {
    const query = `
            DELETE FROM categories
            WHERE id = $1
        `;

    await this.db.query(query, [id]);
  }

  public async categoryInUse(id: any) {
    const query = `
            SELECT id FROM products
            WHERE category_id = $1
            LIMIT 1
        `;

    const { rows } = await this.db.query(query, [id]);

    return rows.length > 0;
  }

  public async hasChildCategories(id: any) {
    const query = {
      text: `
      SELECT id
      FROM categories
      WHERE parent_id = $1
      LIMIT 1
    `,
      values: [id],
    };

    const { rows } = await this.db.query(query);

    return rows.length > 0;
  }
}
