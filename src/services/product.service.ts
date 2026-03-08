import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ProductRepo } from "../repositories/product.repo";
import { badRequest } from "../errors/http.error";
import z from "zod";

@injectable()
export class ProductService {
  constructor(
    @inject(TYPES.ProductRepo)
    private repo: ProductRepo,
  ) {}

  public async getProducts(body: any) {

    const { orgid, domainid } = body;

    // if (!orgid || !domainid) throw badRequest("Orgid or Doaminid is required");

    const { list, count } = await this.repo.getProducts({});


    return { list, count };
  }

  public async createProduct(body: z.infer<typeof this.createProduct>){
    
    await this.repo.createProduct(body);


  }
}
