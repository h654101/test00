"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const dayjs_1 = __importDefault(require("dayjs"));
const getNewToken = (data) => {
    const today = (0, dayjs_1.default)();
    return (0, jsonwebtoken_1.sign)(data, "app-secret-key", {
        expiresIn: today
            .set("hour", 23)
            .set("minute", 59)
            .set("second", 59)
            .diff(today, "seconds"),
    });
};
exports.getNewToken = getNewToken;
