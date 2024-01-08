import { Router } from "express";
import { hashSync } from "bcrypt";
import sql from "../../db";

const router = Router();

router.get("/init", async (req, res, next) => {
  try {
    await sql`DROP TABLE IF EXISTS items`;
    await sql`DROP TABLE IF EXISTS users`;
    await sql`DROP TABLE IF EXISTS roles`;

    await sql`CREATE TABLE roles (
      id serial PRIMARY KEY,
      name VARCHAR (10) NOT NULL UNIQUE,
      version INT NOT NULL DEFAULT(1),
      permissions TEXT[] NOT NULL
    )`;

    await sql`CREATE TABLE users (
      id serial PRIMARY KEY,
      role_id INT NOT NULL,
      username VARCHAR (10) NOT NULL UNIQUE,
      password VARCHAR (90) NOT NULL,
      x INT NOT NULL DEFAULT(0),
      CONSTRAINT user_role FOREIGN KEY(role_id) REFERENCES roles(id)
    )`;

    await sql`CREATE TABLE items (
      id serial PRIMARY KEY,
      name VARCHAR (10) NOT NULL,
      count INT NOT NULL DEFAULT(0)
    )`;

    const roles = [
      {
        name: "admin",
        permissions: [
          "get-users",
          "get-users--",
          "post-users",
          "put-users---password",
        ],
      },
      {
        name: "user",
        permissions: ["get-users"],
      },
      {
        name: "user-plus",
        permissions: ["get-users", "get-users--"],
      },
    ];

    const users = [
      {
        role_id: 1,
        username: "admin",
        password: hashSync("admin", 10),
        x: 0,
      },
      {
        role_id: 2,
        username: "user",
        password: hashSync("user", 10),
        x: 2,
      },
    ];

    await sql`INSERT INTO roles ${sql(roles, "name", "permissions")}`;

    await sql`INSERT INTO users ${sql(
      users,
      "role_id",
      "username",
      "password",
      "x"
    )}`;

    res.send("Success..!");
  } catch (error) {
    next(error);
  }
});

export default router;
