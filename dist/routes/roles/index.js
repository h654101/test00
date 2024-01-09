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
const permissions_json_1 = __importDefault(require("./permissions.json"));
const db_1 = __importDefault(require("../../db"));
const router = (0, express_1.Router)();
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, db_1.default) `SELECT
      id,
      name,
      version,
      permissions
    FROM roles`;
        res.json({ roles: rows, permissions: permissions_json_1.default });
    }
    catch (error) {
        next(error);
    }
}));
router.get("/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rows = yield (0, db_1.default) `SELECT
      id,
      name,
      version,
      permissions
    FROM roles
    WHERE id = ${id}`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id", validate_1.validateParams, (0, validate_1.validateBody)(["permissions"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        const rows = yield (0, db_1.default) `UPDATE roles set
        version = version +1,
        permissions = ${permissions}
      WHERE id = ${id} RETURNING *`;
        const { name, version } = rows[0];
        (0, validate_1.setRoleVersion)(name, version);
        res.json({ id });
    }
    catch (error) {
        next(error);
    }
}));
router.post("/", (0, validate_1.validateBody)(["name", "version", "permissions"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const role = req.body;
        const rows = yield (0, db_1.default) `INSERT into roles ${(0, db_1.default)(role, "name", "version", "permissions")} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.delete("/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rows = yield (0, db_1.default) `DELETE FROM roles WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
