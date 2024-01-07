import { Router } from "express";
import { validateBody, validateParams } from "../../validate";
import { hashSync } from "bcrypt";
import sql from "../../db";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      id,
      username,
      role,
      permissions
    FROM users`;

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await sql`SELECT
      id,
      username,
      role,
      permissions
    FROM users WHERE id=${id}`;

    if (rows.length == 0) return next(new Error(`User ${id} not found`));

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id/password",
  validateParams,
  validateBody(["password"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.body;
      user["password"] = hashSync(user["password"], 10);
      const rows = await sql`UPDATE users set ${sql(
        user,
        "password"
      )} WHERE id=${id} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  validateBody(["username", "password"]),
  async (req, res, next) => {
    try {
      const user = req.body;
      user["role"] = [];
      user["permissions"] = [];
      const rows = await sql`INSERT into users ${sql(
        user,
        "username",
        "password",
        "role",
        "permissions"
      )} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
