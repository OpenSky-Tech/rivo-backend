import { Response } from "express";

type Meta = Record<string, unknown>;

export function success<T>(
    res: Response,
    options: {
        code?: number,
        message?: string,
        data?: T;
        meta?: Meta
    }
) {
    const {
        code = 200,
        message = "Success",
        data,
        meta
    } = options

    return res.status(code).json({
        code,
        success: true,
        message,
        ...(meta ? { meta } : {}),
        ...(data !== undefined ? { data } : {}),
    })
}

export function ok<T>(
    res: Response,
    data?: T,
    message = "Success",
    meta?: Meta
) {
    return success(res, { code: 200, message, data, meta })
}

export function created<T>(
    res: Response,
    data?: T,
    message = "Created successfully",
    meta?: Meta
) {
    return success(res, { code: 201, message, data, meta })
}

export function updated<T>(
    res: Response,
    data?: T,
    message = "Updated successfully",
    meta?: Meta
) {
    return success(res, { code: 200, message, data, meta })
}

export function accepted<T>(
    res: Response,
    data?: T,
    message = "Accepted",
    meta?: Meta
) {
    return success(res, { code: 202, message, data, meta })
}

export function deleted<T>(
    res: Response,
    message = "Deleted successfully",
) {
    return success(res, { code: 200, message })
}

export function noContent(res: Response) {
    return res.status(204).send();
}

export function paginated<T>(
    res: Response,
    data: T,
    params: {
        page: number,
        limit: number;
        total: number
    },
    message = "Success"
) {
    const totalPages = params.limit > 0 ? Math.ceil(params.total / params.limit) : 0;

    return success(res, {
        code: 200,
        message,
        data,
        meta: {
            page: params.page,
            limit: params.limit,
            total: params.total,
            totalPages
        }
    })
}
