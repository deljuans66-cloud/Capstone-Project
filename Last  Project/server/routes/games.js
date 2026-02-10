import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { platform_id } = req.query;

    let query = `
      SELECT g.*, p.name as platform_name
      FROM games g
      JOIN platforms p ON g.platform_id = p.id
    `;
    const params = [];

    if (platform_id) {
      query += " WHERE g.platform_id = $1";
      params.push(platform_id);
    }

    query += " ORDER BY g.title";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).json({ error: "Server error fetching games" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.*, p.name as platform_name
       FROM games g
       JOIN platforms p ON g.platform_id = p.id
       WHERE g.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching game:", err);
    res.status(500).json({ error: "Server error fetching game" });
  }
});

export default router;
