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
const db_1 = __importDefault(require("../../db"));
const router = (0, express_1.Router)();
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, db_1.default) `SELECT
      id,
      name,
      count
    FROM items`;
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
      id,
      name,
      count
    FROM items
    WHERE id = ${id}`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/name", validate_1.validateParams, (0, validate_1.validateBody)(["name"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const rows = yield (0, db_1.default) `UPDATE items set
        name = '${name}'
      WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.put("/:id/count", validate_1.validateParams, (0, validate_1.validateBody)(["count"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { count } = req.body;
        const rows = yield (0, db_1.default) `UPDATE items set
      count = '${count}'
      WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.post("/", (0, validate_1.validateBody)(["name", "count"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = req.body;
        const rows = yield (0, db_1.default) `INSERT into items ${(0, db_1.default)(item, "name", "count")} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
router.delete("/:id", validate_1.validateParams, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rows = yield (0, db_1.default) `DELETE FROM items WHERE id = ${id} RETURNING id`;
        res.json(rows[0]);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
