import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Pool } from "pg";

@injectable()
export class ProductRepo {
  constructor(@inject(TYPES.DbPool) private db: Pool) {}

  public async getProducts(body: any) {
    const {} = body;

    let where = "";
    let values = [];

    const query = {
      text: `
            SELECT
            p.product_id as productid,
            p.name as productname,
            p.base_price as baseprice,
            p.inactive as isinactive,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'variantid', v.variant_id,
                        'sku', v.sku,
                        'barcode', v.barcode,
                        'stock', v.stock,
                        'baseprice', v.base_price,
                        'attrs', v.attrs
                    )
                ) FILTER (WHERE v.variant_id IS NOT NULL),
                 '[]'::jsonb
            ) AS variants
            FROM products p
            LEFT JOIN productvariants v on v.product_id = p.product_id
            ${where}
            GROUP BY p.product_id
            `,
      values: [],
    };

    const res = await this.db.query(query);

    return {
      list: res.rows,
      count: res.rowCount,
    };
  }

  public async createProduct(body: any) {
    const client = await this.db.connect();

    await client.query("BEGIN");

    const productRes = await client.query(
      `
      INSERT INTO products (name, base_price, inactive, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      RETURNING product_id, name, base_price, inactive, created_at, updated_at
      `,
      [body.name, body.basePrice, body.inactive],
    );

    const product = productRes.rows[0];
    const productId = product.product_id;

    const variants = Array.isArray(body.variants) ? body.variants : [];

    if (variants.length > 0) {
      // build VALUES list: ($1,$2,$3...),($...,...)
      const values: any[] = [];
      const chunks: string[] = [];

      // product_id is repeated per row
      // columns: product_id, sku, barcode, stock, base_price, attrs
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
  }
}
