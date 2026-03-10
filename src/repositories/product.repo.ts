import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class ProductRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

  public async getProducts(params: any) {
    const { limit, offset, search, attrs } = params;

    let where = "WHERE 1=1";
    let values = [];
    let index = 1;

    if (search) {
      where += ` AND p.name ILIKE $${index}`;
      values.push(`%${search}%`);
      index++;
    }

    // if (attrs && Object.keys(attrs).length > 0) {
    //   where += ` AND v.attrs @> $${index}::jsonb`;
    //   values.push(JSON.stringify(attrs));
    //   index++;
    // }

    const countQuery = {
      text: `
            SELECT
            COUNT(DISTINCT p.id) as count
            FROM products p
            LEFT JOIN productvariants v on v.product_id = p.id
            ${where}
            `,
      values: [...values],
    };

    const countRes = await this.db.query(countQuery);
    const count = Number(countRes.rows[0].count);

    values.push(limit, offset);
    const limitIndex = index;
    const offsetIndex = index + 1;

    const query = {
      text: `
            SELECT
            p.id as id,
            p.name as name,
            p.base_price::float8 as "basePrice",
            p.inactive as inactive,
            p.created_at as "createdAt",
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'variantId', v.id,
                        'sku', v.sku,
                        'barcode', v.barcode,
                        'stock', v.stock,
                        'basePrice', v.base_price,
                        'attrs', v.attrs
                    )
                ) FILTER (WHERE v.id IS NOT NULL),
                 '[]'::jsonb
            ) AS variants
            FROM products p
            LEFT JOIN productvariants v on v.product_id = p.id
            ${where}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
      values: values,
    };

    const res = await this.db.query(query);

    return {
      list: res.rows,
      total: count,
    };
  }

  public async getProductById(id: any) {
    const query = {
      text: `
            SELECT
            p.id as id,
            p.name as name,
            p.base_price::float8 as "basePrice",
            p.inactive as inactive,
            p.created_at as "createdAt",
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'variantId', v.id,
                        'sku', v.sku,
                        'barcode', v.barcode,
                        'stock', v.stock,
                        'basePrice', v.base_price,
                        'attrs', v.attrs
                    )
                ) FILTER (WHERE v.id IS NOT NULL),
                 '[]'::jsonb
            ) AS variants
            FROM products p
            LEFT JOIN productvariants v on v.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id
            `,
      values: [id],
    };

    const res = await this.db.query(query);

    return res.rows[0];
  }

  public async createProduct(body: any) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const productRes = await client.query(
        `
      INSERT INTO products (name, base_price, inactive, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      RETURNING id, name, base_price, inactive, created_at, updated_at
      `,
        [body.name, body.basePrice, body.inactive],
      );

      const product = productRes.rows[0];
      const productId = product.id;

      const variants = Array.isArray(body.variants) ? body.variants : [];

      if (variants.length > 0) {
        const values: any[] = [];
        const chunks: string[] = [];

        variants.forEach((v: any, i: number) => {
          const base = i * 6;
          chunks.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`,
          );
          values.push(
            productId,
            v.sku,
            v.barcode ?? null,
            v.stock ?? 0,
            v.basePrice,
            JSON.stringify(v.attrs ?? {}),
          );
        });

        await client.query(
          `
        INSERT INTO productvariants
          (product_id, sku, barcode, stock, base_price, attrs)
        VALUES ${chunks.join(", ")}
        `,
          values,
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async updateProduct(id: any, body: any) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const productRes = await client.query(
        `
      UPDATE products
      SET name = $1, base_price = $2, inactive = $3, updated_at = now()
      WHERE id = $4
      RETURNING id, name, base_price, inactive, created_at, updated_at
      `,
        [body.name, body.basePrice, body.inactive, id],
      );

      const product = productRes.rows[0];
      const productId = product.id;

      await client.query(
        `
      DELETE FROM productvariants WHERE product_id = $1
      `,
        [productId],
      );

      const variants = Array.isArray(body.variants) ? body.variants : [];

      if (variants.length > 0) {
        const values: any[] = [];
        const chunks: string[] = [];

        variants.forEach((v: any, i: number) => {
          const base = i * 6;
          chunks.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`,
          );
          values.push(
            productId,
            v.sku,
            v.barcode ?? null,
            v.stock ?? 0,
            v.basePrice,
            JSON.stringify(v.attrs ?? {}),
          );
        });

        await client.query(
          `
        INSERT INTO productvariants
          (product_id, sku, barcode, stock, base_price, attrs)
        VALUES ${chunks.join(", ")}
        `,
          values,
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async deleteProduct(id: any) {
    const client = await this.db.connect();

    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM productvariants WHERE product_id = $1
      `,
      [id],
    );

    await client.query(
      `
      DELETE FROM products WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");
  }
}
