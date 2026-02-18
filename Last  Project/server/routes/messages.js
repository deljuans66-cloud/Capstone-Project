import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { group_id } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: "group_id is required" });
    }

    const result = await pool.query(
      `SELECT m.*, u.username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [group_id],
    );

    res.json(result.rows.reverse());
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT m.*, u.username
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching message:", err);
    res.status(500).json({ error: "Server error fetching message" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { group_id, content } = req.body;
    const user_id = req.user.id;

    if (!group_id || !content) {
      return res
        .status(400)
        .json({ error: "group_id and content are required" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [group_id, user_id],
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You must be a member of the group to send messages" });
    }

    const groupCheck = await pool.query(
      "SELECT * FROM groups WHERE id = $1 AND expires_at > NOW()",
      [group_id],
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Group not found or expired" });
    }

    const result = await pool.query(
      `INSERT INTO messages (group_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [group_id, user_id, content.trim()],
    );

    const userResult = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [user_id],
    );

    const message = {
      ...result.rows[0],
      username: userResult.rows[0].username,
    };

    const io = req.app.get("io");
    io.to(`group_${group_id}`).emit("new_message", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: "Server error creating message" });
  }
});

export default router;
