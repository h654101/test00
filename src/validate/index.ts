import dayjs from "dayjs";
import { CronJob } from "cron";
import { verify, decode } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Rule } from "../@types.js";
import rules from "./rules.json";
import { getNewToken } from "../auth";
import sql from "../db";
import { write } from "../log";

const blackList: number[] = [];
const roleVersions: Record<string, number> = {};
const loginTries: Record<string, number> = {};
const refreshTries: Record<string, number> = {};

CronJob.from({
  cronTime: "00 00 01 * * *",
  onTick: async function () {
    const users = blackList.map((id) => [id]);

    await sql`update users set x = 1
    from (values ${sql(users)}) as update_data (id)
    where users.id = (update_data.id)::int`;

    blackList.length = 0;
    Object.keys(loginTries).forEach((k) => delete loginTries[k]);
    Object.keys(refreshTries).forEach((k) => delete refreshTries[k]);

    write("lists reseted");
  },
  start: true,
});

export const validatePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];

    if (!token) return next(new Error("Authorization missing"));

    let payload: Record<string, any> | undefined;

    let isRefreshNeeded = false;

    try {
      payload = verify(token, "app-secret-key") as Record<string, any>;
    } catch (error: any) {
      if (error.message === "jwt expired") {
        isRefreshNeeded = true;
        payload = decode(token) as Record<string, any>;
      } else {
        return next(error.message || error);
      }
    }

    let { id, username, role, role_version, permissions } = payload!;

    if (blackList.includes(id)) {
      return next(new Error("Forbidden"));
    }

    if (!roleVersions) {
      return next(new Error("Role versions have not been set yet"));
    }

    const roleVersion = roleVersions[role];

    const isRolePermissionUpdated = roleVersion > role_version ? true : false;

    if (isRolePermissionUpdated) {
      const rows =
        await sql`SELECT permissions from roles WHERE name = ${role}`;
      if (rows.length == 0) return next(new Error("Permission not found"));
      permissions = rows[0]["permissions"];
    }

    const permission0 = (req.method + req.originalUrl)
      .replace(/\/|[0-9]/g, "-")
      .toLowerCase();

    if (!permissions.includes(permission0) && id !== 1) {
      return next(new Error("Permission missing"));
    }

    if (isRefreshNeeded) {
      const rows = await sql`SELECT x from users WHERE id = ${id} AND x = 0`;
      if (rows.length == 0) return next(new Error("User not found"));
    }

    if (isRefreshNeeded || isRolePermissionUpdated) {
      const tries = getRefreshTries(id);
      if (tries >= 3) return next(new Error("too mant tries"));
      res.setHeader(
        "x-app-token",
        getNewToken({
          id,
          username,
          role,
          role_version: roleVersion,
          permissions,
        })
      );
      setRefreshTries(id);
    } else {
      setRefreshTries(-id);
    }

    next();
  } catch (error: any) {
    return next(error.message || error);
  }
};

export const validateParams = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
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

export const validateBody = (arr: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const body = req.body;

    if (!body || Object.keys(body).length == 0) {
      return next(new Error(`Body ${body} Is Empty`));
    }

    for (const v of arr) {
      const val = body[v];
      const rule = (rules as Rule)[v];

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
      } else {
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

export const getLoginTries = (id?: number) => getTries(id, loginTries);
export const setLoginTries = (id: number) => setTries(id, loginTries);
export const getRefreshTries = (id?: number) => getTries(id, refreshTries);
export const setRefreshTries = (id: number) => setTries(id, refreshTries);

export const setRoleVersion = (name: string, version: number) => {
  roleVersions[name] = version;
};
export const setBlackList = (id: number) => {
  if (id > 0) {
    blackList.push(id);
  } else {
    const i = blackList.indexOf(+id);
    blackList.splice(i, 1);
  }
};

export const initRoleVersions = async () => {
  const rows = await sql`SELECT name, version FROM roles`;
  rows.forEach((r) => {
    roleVersions[r.name] = r.version;
  });
  console.log("roleVersions ready");
};
export const initBlackList = async () => {
  const rows = await sql`SELECT id FROM users WHERE x = 2`;
  blackList.push(...rows.map((r) => r.id));
  console.log("blackList ready");
};

function getTries(id: number | undefined, _ref: any) {
  if (id) return _ref[`_${id}`] || 0;
  return Object.keys(_ref);
}
function setTries(id: number, _ref: any) {
  const _id = `_${Math.abs(id)}`;
  if (_id === "_1") {
    write("failed try by admin");
    return;
  }
  if (!_ref[_id]) _ref[_id] = 0;
  if (id > 0) {
    _ref[_id]++;
  } else {
    delete _ref[_id];
  }
}
