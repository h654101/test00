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
const validate_1 = require("../../validate");
const bcrypt_1 = require("bcrypt");
const auth_1 = require("../../auth");
const db_1 = __importDefault(require("../../db"));
const router = (0, express_1.Router)();
router.post("/", (0, validate_1.validateBody)(["username", "password"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const rows = yield (0, db_1.default) `SELECT
        users.id,
        users.password,
        roles.name as role,
        roles.version as role_version,
        roles.permissions
      FROM users
      LEFT JOIN roles ON users.role_id=roles.id
      WHERE username=${username} AND x=0`;
        if (rows.length == 0)
            return next(new Error(`Wrong username`));
        const { id, password: hash } = rows[0];
        const tries = (0, validate_1.getLoginTries)(id);
        if (tries >= 3) {
            return next(new Error(`Too many tries`));
        }
        if (!(0, bcrypt_1.compareSync)(password, hash)) {
            (0, validate_1.setLoginTries)(id);
            return next(new Error(`Wrong password`));
        }
        else {
            (0, validate_1.setLoginTries)(-id);
        }
        const { role, role_version, permissions } = rows[0];
        res.setHeader("x-app-token", (0, auth_1.getNewToken)({ id, username, role, role_version, permissions }));
        res.end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
