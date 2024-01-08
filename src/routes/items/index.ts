import { Router } from "express";
import { validateBody, validateParams } from "../../validate";
import sql from "../../db";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      id,
      name,
      count
    FROM items`;

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
      name,
      count
    FROM items
    WHERE id = ${id}`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id/name",
  validateParams,
  validateBody(["name"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const rows = await sql`UPDATE items set
        name = '${name}'
      WHERE id = ${id} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/count",
  validateParams,
  validateBody(["count"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { count } = req.body;
      const rows = await sql`UPDATE items set
      count = '${count}'
      WHERE id = ${id} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", validateBody(["name", "count"]), async (req, res, next) => {
  try {
    const item = req.body;
    const rows = await sql`INSERT into items ${sql(
      item,
      "name",
      "count"
    )} RETURNING id`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await sql`DELETE FROM items WHERE id = ${id} RETURNING id`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
