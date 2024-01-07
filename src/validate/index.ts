import dayjs from "dayjs";
import { CronJob } from "cron";
import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Rule } from "../@types.js";
import rules from "./rules.json";
import { getNewToken } from "../auth";
import sql from "../db";

let blackList: number[] | undefined;
let roleVersions: Record<string, number> | undefined;

if (!roleVersions) {
  sql`SELECT name, version FROM roles`
    .then((rows) => {
      const obj: Record<string, number> = {};
      rows.forEach((r) => {
        obj[r.name] = r.version;
      });
      roleVersions = obj;
      // roleVersions["admin"] += 1;
      console.log("roleVersions has been set");
    })
    .catch((err) => console.log(err));
}

if (!blackList) {
  sql`SELECT id FROM users WHERE x = 2`
    .then((rows) => {
      blackList = rows.map((r) => r.id);
      console.log("blackList has been set");
    })
    .catch((err) => console.log(err));
}

CronJob.from({
  cronTime: "00 00 01 * * *",
  onTick: function () {
    console.log(dayjs().format("hh:mm:ss"));
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

    let { id, role, role_version, permissions } = verify(
      token,
      "app-secret-key"
    ) as any;

    if (blackList!.includes(id)) {
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
      permissions = rows[0]["permissions"];
    }

    const permission0 = (req.method + req.originalUrl)
      .replace(/\/|[0-9]/g, "-")
      .toLowerCase();

    if (!permissions.includes(permission0)) {
      return next(new Error("Permission missing"));
    }

    if (isRolePermissionUpdated) {
      res.setHeader(
        "x-app-token",
        getNewToken({ id, role, role_version: roleVersion, permissions })
      );
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

      if (type === "string") {
        if (val.length < rule.min) {
          return next(new Error(`Short ${v} [${val.length}]`));
        }
        if (val.length > rule.max) {
          return next(new Error(`Too long ${v} [${val.length}]`));
        }
      }

      if (type === "number") {
        if (val < rule.min) {
          return next(new Error(`Small ${v} [${val}]`));
        }
        if (val > rule.max) {
          return next(new Error(`Too long ${v} [${val}]`));
        }
      }
    }

    next();
  };
};
