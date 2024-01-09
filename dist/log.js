"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.write = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({
    password: "F2XAtLSXGjVts5BxQtbqGFYvvX4wH3SI",
    socket: {
        host: "redis-16369.c323.us-east-1-2.ec2.cloud.redislabs.com",
        port: 16369,
    },
});
client.on("error", (err) => console.log(err)).connect();
const write = (txt) => {
    const day = (0, dayjs_1.default)().format("YYYY:MM:DD");
    const time = (0, dayjs_1.default)().format("H:mm:ss");
    const line = `${time} ${txt}`;
    client.lPush(day, line);
};
exports.write = write;
