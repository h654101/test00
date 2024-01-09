import { Router } from "express";
import {
  validateBody,
  validateParams,
  setBlackList,
  getLoginTries,
  setLoginTries,
  getRefreshTries,
  setRefreshTries,
} from "../../validate";
import { hashSync } from "bcrypt";
import sql from "../../db";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 0`;

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/logintries", async (req, res, next) => {
  try {
    res.json(getLoginTries());
  } catch (error) {
    next(error);
  }
});

router.put("/logintries/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    setLoginTries(-id);
    res.json({ id });
  } catch (error) {
    next(error);
  }
});

router.get("/refreshtries", async (req, res, next) => {
  try {
    res.json(getRefreshTries());
  } catch (error) {
    next(error);
  }
});

router.put("/refreshtries/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    setRefreshTries(-id);
    res.json({ id });
  } catch (error) {
    next(error);
  }
});

router.get("/blacklisted", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 2`;

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/deleted", async (req, res, next) => {
  try {
    const rows = await sql`SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE x = 1`;

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await sql`SELECT
      users.id,
      users.username,
      roles.name as role
    FROM users
    LEFT JOIN roles ON users.role_id = roles.id
    WHERE users.id = ${id} AND x = 0`;

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
      )} WHERE id = ${id} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/role",
  validateParams,
  validateBody(["role_id"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.body;
      const rows = await sql`UPDATE users set ${sql(
        user,
        "role_id"
      )} WHERE id = ${id} RETURNING id`;

      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.put("/:id/blacklist", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = {
      x: 2,
    };
    const rows = await sql`UPDATE users set ${sql(
      user,
      "x"
    )} WHERE id = ${id} RETURNING id`;

    const id0 = parseInt(id);
    if (isNaN(id0)) return next(new Error("Id param is NaN"));

    setBlackList(id0);

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id/unblacklist", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = {
      x: 0,
    };
    const rows = await sql`UPDATE users set ${sql(
      user,
      "x"
    )} WHERE id = ${id} RETURNING id`;

    const id0 = parseInt(id);
    if (isNaN(id0)) return next(new Error("Id param is NaN"));
    setBlackList(-id0);

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id/undelete", validateParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = {
      x: 0,
    };
    const rows = await sql`UPDATE users set ${sql(
      user,
      "x"
    )} WHERE id = ${id} RETURNING id`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  validateBody(["username", "password", "role_id"]),
  async (req, res, next) => {
    try {
      const user = req.body;
      user["password"] = hashSync(user["password"], 10);
      const rows = await sql`INSERT into users ${sql(
        user,
        "role_id",
        "username",
        "password"
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
    const user = {
      x: 1,
    };
    const rows = await sql`UPDATE users set ${sql(
      user,
      "x"
    )} WHERE id = ${id} RETURNING id`;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
