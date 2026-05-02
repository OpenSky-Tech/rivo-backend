import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class PermissionRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

  public async getPermissions(params: any) {
    const { limit, offset, name, forView = false } = params;

    let where = "WHERE 1=1";
    let values = [];
    let index = 1;

    if (name) {
      where += ` AND name ILIKE $${index++}`;
      values.push(`%${name}%`);
    }

    const countQuery = {
      text: `
            SELECT COUNT(*) as count
            FROM permissions
            ${where}
            `,
      values: [...values],
    };

    const countRes = await this.db.query(countQuery);
    const count = Number(countRes.rows[0].count);

    let paginationSql = "";
    if (forView) {
      paginationSql = `LIMIT $${index} OFFSET $${index + 1}`;
      values.push(Number(limit), Number(offset));
    }

    const query = `
            SELECT *
            FROM permissions
            ${where}
            ${paginationSql}
        `;

    const { rows } = await this.db.query(query, [...values]);

    return { list: rows, total: count };
  }
}
