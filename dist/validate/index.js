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
exports.initBlackList = exports.initRoleVersions = exports.setBlackList = exports.setRoleVersion = exports.setRefreshTries = exports.getRefreshTries = exports.setLoginTries = exports.getLoginTries = exports.validateBody = exports.validateParams = exports.validatePermissions = void 0;
const cron_1 = require("cron");
const jsonwebtoken_1 = require("jsonwebtoken");
const rules_json_1 = __importDefault(require("./rules.json"));
const auth_1 = require("../auth");
const db_1 = __importDefault(require("../db"));
const log_1 = require("../log");
const blackList = [];
const roleVersions = {};
const loginTries = {};
const refreshTries = {};
cron_1.CronJob.from({
    cronTime: "00 00 01 * * *",
    onTick: function () {
        return __awaiter(this, void 0, void 0, function* () {
            const users = blackList.map((id) => [id]);
            yield (0, db_1.default) `update users set x = 1
    from (values ${(0, db_1.default)(users)}) as update_data (id)
    where users.id = (update_data.id)::int`;
            blackList.length = 0;
            Object.keys(loginTries).forEach((k) => delete loginTries[k]);
            Object.keys(refreshTries).forEach((k) => delete refreshTries[k]);
            (0, log_1.write)("lists reseted");
        });
    },
    start: true,
});
const validatePermissions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers["authorization"];
        if (!token)
            return next(new Error("Authorization missing"));
        let payload;
        let isRefreshNeeded = false;
        try {
            payload = (0, jsonwebtoken_1.verify)(token, "app-secret-key");
        }
        catch (error) {
            if (error.message === "jwt expired") {
                isRefreshNeeded = true;
                payload = (0, jsonwebtoken_1.decode)(token);
            }
            else {
                return next(error.message || error);
            }
        }
        let { id, username, role, role_version, permissions } = payload;
        if (blackList.includes(id)) {
            return next(new Error("Forbidden"));
        }
        if (!roleVersions) {
            return next(new Error("Role versions have not been set yet"));
        }
        const roleVersion = roleVersions[role];
        const isRolePermissionUpdated = roleVersion > role_version ? true : false;
        if (isRolePermissionUpdated) {
            const rows = yield (0, db_1.default) `SELECT permissions from roles WHERE name = ${role}`;
            if (rows.length == 0)
                return next(new Error("Permission not found"));
            permissions = rows[0]["permissions"];
        }
        const permission0 = (req.method + req.originalUrl)
            .replace(/\/|[0-9]/g, "-")
            .toLowerCase();
        if (!permissions.includes(permission0) && id !== 1) {
            return next(new Error("Permission missing"));
        }
        if (isRefreshNeeded) {
            const rows = yield (0, db_1.default) `SELECT x from users WHERE id = ${id} AND x = 0`;
            if (rows.length == 0)
                return next(new Error("User not found"));
        }
        if (isRefreshNeeded || isRolePermissionUpdated) {
            const tries = (0, exports.getRefreshTries)(id);
            if (tries >= 3)
                return next(new Error("too mant tries"));
            res.setHeader("x-app-token", (0, auth_1.getNewToken)({
                id,
                username,
                role,
                role_version: roleVersion,
                permissions,
            }));
            (0, exports.setRefreshTries)(id);
        }
        else {
            (0, exports.setRefreshTries)(-id);
        }
        next();
    }
    catch (error) {
        return next(error.message || error);
    }
});
exports.validatePermissions = validatePermissions;
const validateParams = (req, _res, next) => {
    const params = req.params;
    Object.keys(params).forEach((v) => {
        const param = params[v];
        const num = parseInt(param);
        if (isNaN(num)) {
            return next(new Error(`Wrong ${v} ${param}`));
        }
        if (num <= 0) {
            return next(new Error(`Short ${v} ${param}`));
        }
    });
    next();
};
exports.validateParams = validateParams;
const validateBody = (arr) => {
    return (req, _res, next) => {
        const body = req.body;
        if (!body || Object.keys(body).length == 0) {
            return next(new Error(`Body ${body} Is Empty`));
        }
        for (const v of arr) {
            const val = body[v];
            const rule = rules_json_1.default[v];
            if (!rule) {
                return next(new Error(`Rule Of ${v} Is Missing`));
            }
            if (typeof val == "undefined") {
                return next(new Error(`${v} Is Missing`));
            }
            const type = rule.type;
            if (typeof val !== type) {
                return next(new Error(`Wrong ${v} Type [${typeof val}]`));
            }
            if (type === "number") {
                if (val < rule.min) {
                    return next(new Error(`Small ${v} [${val}]`));
                }
                if (val > rule.max) {
                    return next(new Error(`Too long ${v} [${val}]`));
                }
            }
            else {
                if (val.length < rule.min) {
                    return next(new Error(`Short ${v} [${val.length}]`));
                }
                if (val.length > rule.max) {
                    return next(new Error(`Too long ${v} [${val.length}]`));
                }
            }
        }
        next();
    };
};
exports.validateBody = validateBody;
const getLoginTries = (id) => getTries(id, loginTries);
exports.getLoginTries = getLoginTries;
const setLoginTries = (id) => setTries(id, loginTries);
exports.setLoginTries = setLoginTries;
const getRefreshTries = (id) => getTries(id, refreshTries);
exports.getRefreshTries = getRefreshTries;
const setRefreshTries = (id) => setTries(id, refreshTries);
exports.setRefreshTries = setRefreshTries;
const setRoleVersion = (name, version) => {
    roleVersions[name] = version;
};
exports.setRoleVersion = setRoleVersion;
const setBlackList = (id) => {
    if (id > 0) {
        blackList.push(id);
    }
    else {
        const i = blackList.indexOf(+id);
        blackList.splice(i, 1);
    }
};
exports.setBlackList = setBlackList;
const initRoleVersions = () => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, db_1.default) `SELECT name, version FROM roles`;
    rows.forEach((r) => {
        roleVersions[r.name] = r.version;
    });
    console.log("roleVersions ready");
});
exports.initRoleVersions = initRoleVersions;
const initBlackList = () => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, db_1.default) `SELECT id FROM users WHERE x = 2`;
    blackList.push(...rows.map((r) => r.id));
    console.log("blackList ready");
});
exports.initBlackList = initBlackList;
function getTries(id, _ref) {
    if (id)
        return _ref[`_${id}`] || 0;
    return Object.keys(_ref);
}
function setTries(id, _ref) {
    const _id = `_${Math.abs(id)}`;
    if (_id === "_1") {
        (0, log_1.write)("failed try by admin");
        return;
    }
    if (!_ref[_id])
        _ref[_id] = 0;
    if (id > 0) {
        _ref[_id]++;
    }
    else {
        delete _ref[_id];
    }
}
