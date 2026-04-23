import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class ProductRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

  public async getProducts(params: any) {
    const { limit, offset, search, attrs, shopid, categoryid } = params;

    let where = "WHERE 1=1";
    let values = [];
    let index = 1;

    if (search) {
      where += ` AND p.name ILIKE $${index}`;
      values.push(`%${search}%`);
      index++;
    }

    if (shopid) {
      where += ` AND p.shop_id = $${index++}`;
      values.push(shopid);
    }

    if (categoryid) {
      where += ` AND p.category_id = $${index++}`;
      values.push(categoryid);
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
            p.description as description,
            p.status as productstatus,
            p.is_available_online as isavailableonline,
            p.created_at as "createdAt",

            jsonb_build_object(
                'id', s.id,
                'ownerid', s.owner_id,
                'name', s.name,
                'phone', s.phone,
                'status', s.status,
                'createdAt', s.created_at
            ) as shop,

            jsonb_build_object(
                'id', c.id,
                'parentid', c.parent_id,
                'name', c.name,
                'createdAt', c.created_at
            ) as category,

            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', v.id,
                        'sku', v.sku,
                        'barcode', v.barcode,
                        'stock', v.stock_quantity,
                        'price', v.price,
                        'attrs', v.attrs
                    )
                ) FILTER (WHERE v.id IS NOT NULL),
                 '[]'::jsonb
            ) AS variants
            FROM products p
            LEFT JOIN product_variants v on v.product_id = p.id
            LEFT JOIN shops s on s.id = p.shop_id
            LEFT JOIN categories c on c.id = p.category_id
            ${where}
            GROUP BY p.id, s.id, c.id
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
            p.description as description,
            p.status as productstatus,
            p.is_available_online as isavailableonline,
            p.created_at as "createdAt",

            jsonb_build_object(
                'id', s.id,
                'ownerid', s.owner_id,
                'name', s.name,
                'phone', s.phone,
                'status', s.status,
                'createdAt', s.created_at
            ) as shop,

            jsonb_build_object(
                'id', c.id,
                'parentid', c.parent_id,
                'name', c.name,
                'createdAt', c.created_at
            ) as category,

            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', v.id,
                        'sku', v.sku,
                        'barcode', v.barcode,
                        'stock', v.stock_quantity,
                        'price', v.price,
                        'attrs', v.attrs
                    )
                ) FILTER (WHERE v.id IS NOT NULL),
                 '[]'::jsonb
            ) AS variants
            FROM products p
            LEFT JOIN product_variants v on v.product_id = p.id
            LEFT JOIN shops s on s.id = p.shop_id
            LEFT JOIN categories c on c.id = p.category_id
            WHERE p.id = $1
            GROUP BY p.id, s.id, c.id
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
      INSERT INTO products (
      shop_id, 
      category_id, 
      name, 
      description,
      status,
      is_available_online,
      created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, now() )
      RETURNING id
      `,
        [
          body.shopid,
          body.categoryid,
          body.name,
          body.description,
          body.status,
          body.isAvailableOnline ?? false,
        ],
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
            v.price,
            JSON.stringify(v.attrs ?? {}),
          );
        });

        await client.query(
          `
        INSERT INTO product_variants
          (
        product_id, 
        sku, 
        barcode, 
        stock_quantity, 
        price, 
        attrs)
        VALUES ${chunks.join(", ")}
        `,
          values,
        );
      }

      await client.query("COMMIT");

      return { id: productId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async updateProduct(id: string, body: any) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const sets: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (Object.prototype.hasOwnProperty.call(body, "shopid")) {
        sets.push(`shop_id = $${index++}`);
        values.push(body.shopid);
      }

      if (Object.prototype.hasOwnProperty.call(body, "categoryid")) {
        sets.push(`category_id = $${index++}`);
        values.push(body.categoryid ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(body, "name")) {
        sets.push(`name = $${index++}`);
        values.push(body.name);
      }

      if (Object.prototype.hasOwnProperty.call(body, "description")) {
        sets.push(`description = $${index++}`);
        values.push(body.description ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(body, "status")) {
        sets.push(`status = $${index++}`);
        values.push(body.status ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(body, "isAvailableOnline")) {
        sets.push(`is_available_online = $${index++}`);
        values.push(body.isAvailableOnline ?? null);
      }

      sets.push(`updated_at = NOW()`);

      values.push(id);

      const productRes = await client.query(
        `
      UPDATE products
      SET ${sets.join(", ")}
      WHERE id = $${index}
      RETURNING id
      `,
        values,
      );

      if (productRes.rowCount === 0) {
        throw new Error("Product not found");
      }

      const productId = productRes.rows[0].id;

      if (Object.prototype.hasOwnProperty.call(body, "variants")) {
        await client.query(
          `
        DELETE FROM product_variants
        WHERE product_id = $1
        `,
          [productId],
        );

        const variants = Array.isArray(body.variants) ? body.variants : [];

        if (variants.length > 0) {
          const variantValues: any[] = [];
          const chunks: string[] = [];

          variants.forEach((v: any, i: number) => {
            const base = i * 6;

            chunks.push(
              `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::jsonb)`,
            );

            variantValues.push(
              productId,
              v.sku,
              v.barcode?.trim() || null,
              v.stock ?? 0,
              v.price,
              JSON.stringify(v.attrs ?? {}),
            );
          });

          await client.query(
            `
          INSERT INTO product_variants (
            product_id,
            sku,
            barcode,
            stock_quantity,
            price,
            attrs
          )
          VALUES ${chunks.join(", ")}
          `,
            variantValues,
          );
        }
      }

      await client.query("COMMIT");

      return { id: productId };
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
      DELETE FROM product_variants WHERE product_id = $1
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
