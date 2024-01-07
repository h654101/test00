import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { validatePermissions } from "./validate";

import adminRouter from "./routes/admin";
import loginRouter from "./routes/login";
import usersRouter from "./routes/users";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRouter);
app.use("/login", loginRouter);
app.use("/users", validatePermissions, usersRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.get("/hello", (req, res) => {
  const permission = (req.method + req.url).replace(/\//g, "-").toLowerCase();
  res.send(permission);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  res.status(400).send(err.message || err);
});

io.on("connection", (socket) => {
  // ...
});

httpServer.listen(PORT, () => {
  console.log(`Listening on ${PORT} ...`);
});
