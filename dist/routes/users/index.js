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
const db_1 = __importDefault(require("../../db"));
const router = (0, express_1.Router)();
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, db_1.default) `SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 0`;
        res.json(rows);
    }
    catch (error) {
        next(error);
    }
}));
router.get("/logintries", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json((0, validate_1.getLoginTries)());
    }
    catch (error) {
        next(error);
    }
}));
router.put("/logintries/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        (0, validate_1.setLoginTries)(-id);
        res.json({ id });
    }
    catch (error) {
        next(error);
    }
}));
router.get("/refreshtries", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json((0, validate_1.getRefreshTries)());
    }
    catch (error) {
        next(error);
    }
}));
router.put("/refreshtries/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        (0, validate_1.setRefreshTries)(-id);
        res.json({ id });
    }
    catch (error) {
        next(error);
    }
}));
router.get("/blacklisted", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, db_1.default) `SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 2`;
        res.json(rows);
    }
    catch (error) {
        next(error);
    }
}));
router.get("/deleted", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, db_1.default) `SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 1`;
        res.json(rows);
    }
    catch (error) {
        next(error);
    }
}));
router.get("/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rows = yield (0, db_1.default) `SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE users.id = ${id} AND x = 0`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/password", validate_1.validateParams, (0, validate_1.validateBody)(["password"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.body;
        user["password"] = (0, bcrypt_1.hashSync)(user["password"], 10);
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "password")} WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/role", validate_1.validateParams, (0, validate_1.validateBody)(["role_id"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.body;
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "role_id")} WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/blacklist", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = {
            x: 2,
        };
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "x")} WHERE id = ${id} RETURNING id`;
        const id0 = parseInt(id);
        if (isNaN(id0))
            return next(new Error("Id param is NaN"));
        (0, validate_1.setBlackList)(id0);
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/unblacklist", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = {
            x: 0,
        };
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "x")} WHERE id = ${id} RETURNING id`;
        const id0 = parseInt(id);
        if (isNaN(id0))
            return next(new Error("Id param is NaN"));
        (0, validate_1.setBlackList)(-id0);
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/undelete", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = {
            x: 0,
        };
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "x")} WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.post("/", (0, validate_1.validateBody)(["username", "password", "role_id"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.body;
        user["password"] = (0, bcrypt_1.hashSync)(user["password"], 10);
        const rows = yield (0, db_1.default) `INSERT into users ${(0, db_1.default)(user, "role_id", "username", "password")} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.delete("/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = {
            x: 1,
        };
        const rows = yield (0, db_1.default) `UPDATE users set ${(0, db_1.default)(user, "x")} WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
