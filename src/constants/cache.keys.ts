export const CACHE_KEYS = {
    PRODUCT_LIST_VERSION: "product:list:version",
    productList: (limit: number, page: number, search: string, version: string) => `products:${limit}:${page}:${search}:${version}`,
    productDetail: (id: string | number) => `product:${id}`,
    
    SHOP_LIST_VERSION: "shop:list:version",
    shopList: (limit: number, page: number, search: string, version: string) => `shops:${limit}:${page}:${search}:${version}`,
    shopDetail: (id: string | number) => `shop:${id}`,
};
