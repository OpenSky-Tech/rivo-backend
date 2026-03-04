import { NextFunction, Request, Response } from "express";
import { injectable } from "inversify";
import { BaseMiddleware } from "inversify-express-utils";
import jwt from "jsonwebtoken";
import { internalError, unauthorized } from "../errors/http.error";

@injectable()
export class AuthMiddle extends BaseMiddleware {
  public handler(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return next(unauthorized("Missing token"));
    }

    const token = auth.slice("Bearer ".length).trim();

    try {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return next(internalError("Missing JWT_SECRET"));
      }

      const payload = jwt.verify(token, secret);
      res.locals.user = payload;

      return next();
    } catch (err: any) {
      const msg =
        err?.name === "TokenExpiredError" ? "Token expired" : "Invalid token";

      return next(unauthorized(msg));
    }
  }
}
