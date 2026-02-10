import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.platform_id, u.created_at, u.updated_at,
              p.name as platform_name
       FROM users u
       LEFT JOIN platforms p ON u.platform_id = p.id
       WHERE u.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    const user_id = req.user.id;

    if (parseInt(id) !== user_id) {
      return res
        .status(403)
        .json({ error: "Can only update your own profile" });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      if (username.length < 3) {
        return res
          .status(400)
          .json({ error: "Username must be at least 3 characters" });
      }

      const usernameCheck = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, id],
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: "Username already taken" });
      }
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id],
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already taken" });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, username, email, platform_id, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Server error updating user" });
  }
});

router.get("/me/profile", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.platform_id, u.created_at, u.updated_at,
              p.name as platform_name
       FROM users u
       LEFT JOIN platforms p ON u.platform_id = p.id
       WHERE u.id = $1`,
      [user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

export default router;
