import { Router } from "express";
import { validateBody, validateParams, setRoleVersion } from "../../validate";
import permissions from "./permissions.json";
import sql from "../../db";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      id,
      name,
      version,
      permissions
    FROM roles`;

    res.json({ roles: rows, permissions });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await sql`SELECT
      id,
      name,
      version,
      permissions
    FROM roles
    WHERE id = ${id}`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validateParams,
  validateBody(["permissions"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const rows = await sql`UPDATE roles set
        version = version +1,
        permissions = ${permissions}
      WHERE id = ${id} RETURNING *`;

      const { name, version } = rows[0];

      setRoleVersion(name, version);

      res.json({ id });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  validateBody(["name", "version", "permissions"]),
  async (req, res, next) => {
    try {
      const role = req.body;
      const rows = await sql`INSERT into roles ${sql(
        role,
        "name",
        "version",
        "permissions"
      )} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await sql`DELETE FROM roles WHERE id = ${id} RETURNING id`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
