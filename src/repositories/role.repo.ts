import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";
import { notFound } from "../errors/http.error";

@injectable()
export class RoleRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

    public async getRolesSimple(params: any) {
      const { limit, offset, name, shopid, forView = false } = params;

      let where = "WHERE 1=1";
      let values = [];
      let index = 1;

      if (name) {
        where += ` AND name ILIKE $${index++}`;
        values.push(`%${name}%`);
      }

      if (shopid) {
        where += ` AND shop_id = $${index++}`;
        values.push(shopid);
      }

      const countQuery = {
        text: `
              SELECT COUNT(*) as count
              FROM roles
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
              FROM roles
              ${where}
              ${paginationSql}
          `;

      const { rows } = await this.db.query(query, [...values]);

      return { list: rows, total: count };
    }

  public async getRoles(params: any) {
    const { limit, offset, name, shopid = null } = params;

    let where = "WHERE 1=1";
    const values: any[] = [];
    let index = 1;

    if (name) {
      where += ` AND r.name ILIKE $${index++}`;
      values.push(`%${name}%`);
    }

    if (shopid) {
      where += ` AND r.shop_id = $${index++}`;
      values.push(shopid);
    }

    const countQuery = {
      text: `
        SELECT COUNT(*)::int AS count
        FROM roles r
        ${where}
      `,
      values: [...values],
    };

    const countRes = await this.db.query(countQuery);
    const total = Number(countRes.rows[0]?.count || 0);

    values.push(limit, offset);
    const limitIndex = index;
    const offsetIndex = index + 1;

    const query = {
      text: `
      SELECT
        r.id,
        r.shop_id AS shopid,
        r.name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name
            )
            ORDER BY p.name ASC
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      ${where}
      GROUP BY r.id
      ORDER BY r.name ASC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
      values,
    };

    const { rows } = await this.db.query(query);

    return { list: rows, total };
  }

  public async getRoleById(id: any, shopid?: any) {
    let where = `WHERE r.id = $1`;
    let values: any[] = [id];
    let index = 2;

    if (shopid) {
      where += ` AND r.shop_id = $${index++}`;
      values.push(shopid);
    }

    const query = {
      text: `
      SELECT
        r.id,
        r.shop_id AS shopid,
        r.name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name
            )
            ORDER BY p.name ASC
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      ${where}
      GROUP BY r.id
    `,
      values,
    };

    const { rows } = await this.db.query(query);

    if (rows.length === 0) {
      throw notFound("Role not found");
    }

    return rows[0];
  }

  public async createRole(body: any) {
    const { shopid = null, name, permissionids } = body;

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // const duplicateRes = await client.query(
      //   `
      //   SELECT id
      //   FROM roles
      //   WHERE shop_id = $1
      //     AND LOWER(TRIM(name)) = LOWER(TRIM($2))
      //   `,
      //   [shopid, name],
      // );

      // if ((duplicateRes.rowCount ?? 0) > 0) {
      //   throw new Error("Role already exists in this shop");
      // }

      const roleRes = await client.query(
        `
        INSERT INTO roles (
          shop_id,
          name
        )
        VALUES ($1, $2)
        RETURNING *
        `,
        [shopid, name],
      );

      const role = roleRes.rows[0];

      if (permissionids.length > 0) {
        const values: any[] = [];
        const chunks: string[] = [];

        permissionids.forEach((permissionid: string, index: number) => {
          values.push(role.id, permissionid);

          const base = index * 2;
          chunks.push(`($${base + 1}, $${base + 2})`);
        });

        await client.query(
          `
        INSERT INTO role_permissions (
          role_id,
          permission_id
        )
        VALUES ${chunks.join(", ")}
        `,
          values,
        );
      }

      await client.query("COMMIT");

      return { id: role.id };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateRole(id: string, body: any) {
    const { shopid = null, name, permissionids } = body;

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // const roleRes = await client.query(
      //   `
      //   SELECT *
      //   FROM roles
      //   WHERE id = $1
      //     AND shop_id = $2
      //   `,
      //   [id, shopid],
      // );

      // if (roleRes.rowCount === 0) {
      //   throw notFound("Role not found for this shop");
      // }

      // let updatedRole = roleRes.rows[0];

      if (name) {
        // const duplicateRes = await client.query(
        //   `
        // SELECT id
        // FROM roles
        // WHERE shop_id = $1
        //   AND LOWER(TRIM(name)) = LOWER(TRIM($1))
        //   AND id != $2
        // `,
        //   [shopid, name, id],
        // );

        // if ((duplicateRes.rowCount ?? 0) > 0) {
        //   throw new Error("Role already exists in this shop");
        // }

        await client.query(
          `
        UPDATE roles
        SET
          name = $1
        WHERE id = $2
        RETURNING *
        `,
          [name, id],
        );
      }

      if (Array.isArray(permissionids)) {
        await client.query(
          `
        DELETE FROM role_permissions
        WHERE role_id = $1
        `,
          [id],
        );

        if (permissionids.length > 0) {
          const values: any[] = [];
          const chunks: string[] = [];

          permissionids.forEach((permissionid: string, index: number) => {
            values.push(id, permissionid);

            const base = index * 2;
            chunks.push(`($${base + 1}, $${base + 2})`);
          });

          await client.query(
            `
          INSERT INTO role_permissions (
            role_id,
            permission_id
          )
          VALUES ${chunks.join(", ")}
          `,
            values,
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  //   public async deleteCategory(id: any) {
  //     const query = `
  //             DELETE FROM categories
  //             WHERE id = $1
  //         `;

  //     await this.db.query(query, [id]);
  //   }

  //   public async shopInUse(id: any) {
  //     const query = `
  //             SELECT * FROM products
  //             WHERE shop_id = $1
  //         `;

  //     const { rows } = await this.db.query(query, [id]);

  //     return rows.length > 0;
  //   }
}
