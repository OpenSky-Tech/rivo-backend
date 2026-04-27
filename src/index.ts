import "reflect-metadata"; // for @injectable, @inject. @controller (without this di break)
import dotenv from "dotenv";
dotenv.config();

import "./controllers"; //import controllers -> routes register
import { container } from "./config/inversify.config";

import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import * as http from "http";
import helmet from "helmet";
import cors from "cors";
import { errorHandler } from "./middleware/errorhandler.middleware";
import { notFound } from "./errors/http.error";
import { setupSwagger } from "./config/swagger";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );
  app.use(
    cors({
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


  setupSwagger(app);
});

server.setErrorConfig((app) => {

  app.use((req, res, next) => {
    next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);
});

const app = server.build();
const httpServer = http.createServer(app);

const port = Number(process.env.PORT || 3000);
httpServer.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
  console.log(`Swagger UI → http://localhost:${port}/api-docs`);
});
