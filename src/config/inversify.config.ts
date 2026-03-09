import { Container } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../types";
import { pool } from "./database";
import { ProductRepo } from "../repositories/product.repo";
import { ProductService } from "../services/product.service";
import { AuthMiddle } from "../middleware/auth.middleware";
import { CacheService } from "../services/cache.service";

export const container = new Container();

container.bind<Pool>(TYPES.DbPool).toConstantValue(pool); //bind key to object, same object always

container.bind(AuthMiddle).toSelf().inSingletonScope(); //bind class

//bind key to class
container
  .bind<CacheService>(TYPES.CacheService)
  .to(CacheService)
  .inSingletonScope();
container
  .bind<ProductRepo>(TYPES.ProductRepo)
  .to(ProductRepo)
  .inSingletonScope();
container
  .bind<ProductService>(TYPES.ProductService)
  .to(ProductService)
  .inSingletonScope();
