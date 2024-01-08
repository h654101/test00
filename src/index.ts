import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setBlackList, setRoleVersions, validatePermissions } from "./validate";

import adminRouter from "./routes/admin";
import loginRouter from "./routes/login";
import rolesRouter from "./routes/roles";
import usersRouter from "./routes/users";
import itemsRouter from "./routes/items";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRouter);
app.use("/login", loginRouter);
app.use("/roles", validatePermissions, rolesRouter);
app.use("/users", validatePermissions, usersRouter);
app.use("/items", validatePermissions, itemsRouter);

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

(async () => {
  try {
    await setBlackList();
    await setRoleVersions();
    httpServer.listen(PORT, () => {
      console.log(`Listening on ${PORT} ...`);
    });
  } catch (error) {
    console.log(error);
  }
})();

// import { createClient } from 'redis';

// const client = createClient({
//     password: 'F2XAtLSXGjVts5BxQtbqGFYvvX4wH3SI',
//     socket: {
//         host: 'redis-16369.c323.us-east-1-2.ec2.cloud.redislabs.com',
//         port: 16369
//     }
// });
