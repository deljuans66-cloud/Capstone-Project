import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { game_id } = req.query;

    let query = `
      SELECT g.*, u.username as creator_name, ga.title as game_title,
             (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
      FROM groups g
      JOIN users u ON g.creator_id = u.id
      JOIN games ga ON g.game_id = ga.id
      WHERE g.expires_at > NOW()
    `;
    const params = [];

    if (game_id) {
      query += " AND g.game_id = $1";
      params.push(game_id);
    }

    query += " ORDER BY g.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Server error fetching groups" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.*, u.username as creator_name, ga.title as game_title, ga.platform_id
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       JOIN games ga ON g.game_id = ga.id
       WHERE g.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ error: "Server error fetching group" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, game_id } = req.body;
    const creator_id = req.user.id;

    if (!name || !game_id) {
      return res
        .status(400)
        .json({ error: "Group name and game_id are required" });
    }

    if (name.length < 3) {
      return res
        .status(400)
        .json({ error: "Group name must be at least 3 characters" });
    }

    await client.query("BEGIN");

    const groupResult = await client.query(
      `INSERT INTO groups (name, game_id, creator_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, game_id, creator_id],
    );

    const group = groupResult.rows[0];

    await client.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [group.id, creator_id],
    );

    await client.query("COMMIT");

    const result = await pool.query(
      `SELECT g.*, u.username as creator_name, ga.title as game_title
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       JOIN games ga ON g.game_id = ga.id
       WHERE g.id = $1`,
      [group.id],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Server error creating group" });
  } finally {
    client.release();
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user_id = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (name.length < 3) {
      return res
        .status(400)
        .json({ error: "Group name must be at least 3 characters" });
    }

    const groupCheck = await pool.query(
      "SELECT creator_id FROM groups WHERE id = $1",
      [id],
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (groupCheck.rows[0].creator_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Only the group creator can update the group" });
    }

    const result = await pool.query(
      `UPDATE groups SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, id],
    );

    const io = req.app.get("io");
    io.to(`group_${id}`).emit("group_updated", { groupId: id, name });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({ error: "Server error updating group" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const groupCheck = await pool.query(
      "SELECT creator_id FROM groups WHERE id = $1",
      [id],
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (groupCheck.rows[0].creator_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Only the group creator can delete the group" });
    }

    const io = req.app.get("io");
    io.to(`group_${id}`).emit("group_deleted", { groupId: id });

    await pool.query("DELETE FROM groups WHERE id = $1", [id]);

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ error: "Server error deleting group" });
  }
});

router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const groupCheck = await pool.query(
      "SELECT * FROM groups WHERE id = $1 AND expires_at > NOW()",
      [id],
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Group not found or expired" });
    }

    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
      [id, user_id],
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: "Already a member of this group" });
    }

    await pool.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
      [id, user_id],
    );

    res.json({ message: "Joined group successfully" });
  } catch (err) {
    console.error("Error joining group:", err);
    res.status(500).json({ error: "Server error joining group" });
  }
});

router.post("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const groupCheck = await pool.query(
      "SELECT creator_id FROM groups WHERE id = $1",
      [id],
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (groupCheck.rows[0].creator_id === user_id) {
      return res
        .status(400)
        .json({ error: "Creator cannot leave. Delete the group instead." });
    }

    const result = await pool.query(
      "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *",
      [id, user_id],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Not a member of this group" });
    }

    res.json({ message: "Left group successfully" });
  } catch (err) {
    console.error("Error leaving group:", err);
    res.status(500).json({ error: "Server error leaving group" });
  }
});

router.get("/:id/members", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at`,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Server error fetching members" });
  }
});

export async function cleanupExpiredGroups(io) {
  try {
    const expiredGroups = await pool.query(
      "SELECT id FROM groups WHERE expires_at <= NOW()",
    );

    for (const group of expiredGroups.rows) {
      io.to(`group_${group.id}`).emit("group_deleted", {
        groupId: group.id,
        reason: "expired",
      });
    }

    const result = await pool.query(
      "DELETE FROM groups WHERE expires_at <= NOW() RETURNING id",
    );

    if (result.rows.length > 0) {
      console.log(`Cleaned up ${result.rows.length} expired groups`);
    }
  } catch (err) {
    console.error("Error cleaning up expired groups:", err);
    throw err;
  }
}

export default router;
