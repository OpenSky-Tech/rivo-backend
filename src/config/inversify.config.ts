import { Container } from "inversify";
import { Pool } from "pg";
import { TYPES } from "../types";
import { pool } from "./database";
import { ProductRepo } from "../repositories/product.repo";
import { ProductService } from "../services/product.service";
import { AuthMiddle } from "../middleware/auth.middleware";
// import { CacheService } from "../services/cache.service";
import { ShopRepo } from "../repositories/shop.repo";
import { ShopService } from "../services/shop.service";
import { CategoryRepo } from "../repositories/category.repo";
import { CategoryService } from "../services/category.service";
import { PermissionRepo } from "../repositories/permission.repo";
import { PermissionService } from "../services/permission.service";
import { RoleRepo } from "../repositories/role.repo";
import { RoleService } from "../services/role.service";
// import { InvalidateCacheService } from "../services/invalidate_cache.service";

export const container = new Container();

container.bind<Pool>(TYPES.DbPool).toConstantValue(pool); //bind key to object, same object always

container.bind(AuthMiddle).toSelf().inSingletonScope(); //bind class

//bind key to class
// container
//   .bind<CacheService>(TYPES.CacheService)
//   .to(CacheService)
//   .inSingletonScope();
// container
//   .bind<InvalidateCacheService>(TYPES.InvalidateCacheService)
//   .to(InvalidateCacheService)
//   .inSingletonScope();

//Shop
container.bind<ShopRepo>(TYPES.ShopRepo).to(ShopRepo).inSingletonScope();
container
  .bind<ShopService>(TYPES.ShopService)
  .to(ShopService)
  .inSingletonScope();


//Role
container
  .bind<RoleRepo>(TYPES.RoleRepo)
  .to(RoleRepo)
  .inSingletonScope();
container
  .bind<RoleService>(TYPES.RoleService)
  .to(RoleService)
  .inSingletonScope();

//Permission
container
  .bind<PermissionRepo>(TYPES.PermissionRepo)
  .to(PermissionRepo)
  .inSingletonScope();
container
  .bind<PermissionService>(TYPES.PermissionService)
  .to(PermissionService)
  .inSingletonScope();
  
//Category
container
  .bind<CategoryRepo>(TYPES.CategoryRepo)
  .to(CategoryRepo)
  .inSingletonScope();
container
  .bind<CategoryService>(TYPES.CategoryService)
  .to(CategoryService)
  .inSingletonScope();

//Product
container
  .bind<ProductRepo>(TYPES.ProductRepo)
  .to(ProductRepo)
  .inSingletonScope();
container
  .bind<ProductService>(TYPES.ProductService)
  .to(ProductService)
  .inSingletonScope();
