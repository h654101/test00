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
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const validate_1 = require("./validate");
const admin_1 = __importDefault(require("./routes/admin"));
const login_1 = __importDefault(require("./routes/login"));
const roles_1 = __importDefault(require("./routes/roles"));
const users_1 = __importDefault(require("./routes/users"));
const items_1 = __importDefault(require("./routes/items"));
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/admin", admin_1.default);
app.use("/login", login_1.default);
app.use("/roles", validate_1.validatePermissions, roles_1.default);
app.use("/users", validate_1.validatePermissions, users_1.default);
app.use("/items", validate_1.validatePermissions, items_1.default);
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
/* options */
});
app.get("/hello", (req, res) => {
    const permission = (req.method + req.url).replace(/\//g, "-").toLowerCase();
    res.send(permission);
});
app.use((err, req, res, next) => {
    console.log(err);
    res.status(400).send(err.message || err);
});
io.on("connection", (socket) => {
    // ...
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, validate_1.initBlackList)();
        yield (0, validate_1.initRoleVersions)();
        httpServer.listen(PORT, () => {
            console.log(`Listening on ${PORT} ...`);
        });
    }
    catch (error) {
        console.log(error);
    }
}))();
