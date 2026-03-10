export const CACHE_KEYS = {
    PRODUCT_LIST_VERSION: "product:list:version",
    productList: (limit: number, page: number, search: string, version: string) => `products:${limit}:${page}:${search}:${version}`,
    productDetail: (id: string | number) => `product:${id}`,
};
