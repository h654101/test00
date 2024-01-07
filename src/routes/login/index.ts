import { Router } from "express";
import { validateBody } from "../../validate";
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
      const { password: hash } = rows[0];
      if (!compareSync(password, hash))
        return next(new Error(`Wrong password`));

      const { id, role, role_version, permissions } = rows[0];

      res.setHeader(
        "x-app-token",
        getNewToken({ id, role, role_version, permissions })
      );

      res.end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
