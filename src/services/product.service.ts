import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ProductRepo } from "../repositories/product.repo";
import { notFound } from "../errors/http.error";
import z from "zod";

@injectable()
export class ProductService {
  constructor(
    @inject(TYPES.ProductRepo)
    private repo: ProductRepo,
  ) { }

  public async getProducts(query: any) {

    const limit = Number(query.limit) || 5;
    const page = Number(query.page) || 1;
    const offset = (page - 1) * limit;
    const search = (query.search || "").trim();

    const { list, total } = await this.repo.getProducts({ limit, offset, search });


    return { list, limit, page, total: Number(total) };
  }

  public async getProductById(id: any) {
    const product = await this.repo.getProductById(id);

    if (!product) {
      throw notFound("Product not found");
    }

    return product;
  }

  public async createProduct(body: z.infer<typeof this.createProduct>) {

    await this.repo.createProduct(body);

  }

  public async updateProduct(id: any, body: any) {
    const exists = await this.repo.getProductById(id);

    if (!exists) {
      throw notFound("Product not found");
    }

    await this.repo.updateProduct(id, body);

    const updatedProduct = await this.repo.getProductById(id);

    return updatedProduct;
  }

  public async deleteProduct(id: any) {
    const exists = await this.repo.getProductById(id);

    if (!exists) {
      throw notFound("Product not found");
    }

    await this.repo.deleteProduct(id);
  }
}
