"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = require("bcrypt");
const db_1 = __importDefault(require("../../db"));
const router = (0, express_1.Router)();
router.get("/init", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default) `DROP TABLE IF EXISTS items`;
        yield (0, db_1.default) `DROP TABLE IF EXISTS users`;
        yield (0, db_1.default) `DROP TABLE IF EXISTS roles`;
        yield (0, db_1.default) `CREATE TABLE roles (
      id serial PRIMARY KEY,
      name VARCHAR (10) NOT NULL UNIQUE,
      version INT NOT NULL DEFAULT(1),
      permissions TEXT[] NOT NULL
    )`;
        yield (0, db_1.default) `CREATE TABLE users (
      id serial PRIMARY KEY,
      role_id INT NOT NULL,
      username VARCHAR (10) NOT NULL UNIQUE,
      password VARCHAR (90) NOT NULL,
      x INT NOT NULL DEFAULT(0),
      CONSTRAINT user_role FOREIGN KEY(role_id) REFERENCES roles(id)
    )`;
        yield (0, db_1.default) `CREATE TABLE items (
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
                password: (0, bcrypt_1.hashSync)("admin", 10),
                x: 0,
            },
            {
                role_id: 2,
                username: "user",
                password: (0, bcrypt_1.hashSync)("user", 10),
                x: 2,
            },
        ];
        yield (0, db_1.default) `INSERT INTO roles ${(0, db_1.default)(roles, "name", "permissions")}`;
        yield (0, db_1.default) `INSERT INTO users ${(0, db_1.default)(users, "role_id", "username", "password", "x")}`;
        res.send("Success..!");
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
