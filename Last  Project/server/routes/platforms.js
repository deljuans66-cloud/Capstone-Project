import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM platforms ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching platforms:", err);
    res.status(500).json({ error: "Server error fetching platforms" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM platforms WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Platform not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching platform:", err);
    res.status(500).json({ error: "Server error fetching platform" });
  }
});

export default router;
