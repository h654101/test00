import { Router } from "express";
import { validateBody, getLoginTries, setLoginTries } from "../../validate";
import { compareSync } from "bcrypt";
import { getNewToken } from "../../auth";
import sql from "../../db";

const router = Router();

router.post(
  "/",
  validateBody(["username", "password"]),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const rows = await sql`SELECT
        users.id,
        users.password,
        roles.name as role,
        roles.version as role_version,
        roles.permissions
      FROM users
      LEFT JOIN roles ON users.role_id=roles.id
      WHERE username=${username} AND x=0`;

      if (rows.length == 0) return next(new Error(`Wrong username`));

      const { id, password: hash } = rows[0];

      const tries = getLoginTries(id) as number;

      if (tries >= 3) {
        return next(new Error(`Too many tries`));
      }

      if (!compareSync(password, hash)) {
        setLoginTries(id);
        return next(new Error(`Wrong password`));
      } else {
        setLoginTries(-id);
      }

      const { role, role_version, permissions } = rows[0];

      res.setHeader(
        "x-app-token",
        getNewToken({ id, username, role, role_version, permissions })
      );

      res.end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
