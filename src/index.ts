import "reflect-metadata"; // for @injectable, @inject. @controller (without this di break)
import dotenv from "dotenv";
dotenv.config();

import "./controllers"; //import controllers -> routes register
import { container } from "./inversify.config"; // DI set up

import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import * as http from "http";
import helmet from "helmet";
import cors from "cors";
import { errorHandler } from "./middleware/errorhandler.middleware";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
});

server.setErrorConfig((app) => {
  app.use(errorHandler);
});

const app = server.build();
const httpServer = http.createServer(app);

const port = Number(process.env.PORT || 3000);
httpServer.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
