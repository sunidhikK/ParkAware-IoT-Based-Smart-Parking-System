const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/public/stats — no auth required
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM slots').get().count;
    const occupied = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'occupied'").get().count;
    const reserved = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'reserved'").get().count;
    const available = total - occupied - reserved;

    const floors = db.prepare('SELECT DISTINCT floor FROM slots ORDER BY floor').all().map(f => f.floor);

    const activeUsers = db.prepare(
      "SELECT COUNT(DISTINCT user_id) as count FROM parking_records WHERE status = 'active'"
    ).get().count;

    res.json({
      total,
      occupied,
      reserved,
      available,
      floors: floors.length,
      activeUsers,
      occupancy: total > 0 ? Math.round((occupied / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/public/activity — recent parking activity, no auth
router.get('/activity', (req, res) => {
  try {
    const records = db.prepare(`
      SELECT
        pr.vehicle_number,
        pr.status,
        pr.entry_time,
        pr.exit_time,
        pr.created_at,
        s.slot_number,
        CASE
          WHEN pr.status = 'completed' THEN pr.exit_time
          WHEN pr.status = 'active' THEN pr.entry_time
          ELSE pr.created_at
        END as sort_time
      FROM parking_records pr
      JOIN slots s ON s.id = pr.slot_id
      ORDER BY sort_time DESC
      LIMIT 8
    `).all();

    const activity = records.map(r => {
      let action, time;
      if (r.status === 'completed') {
        action = 'exited';
        time = r.exit_time;
      } else if (r.status === 'active') {
        action = 'parked';
        time = r.entry_time;
      } else if (r.status === 'reserved') {
        action = 'reserved';
        time = r.created_at;
      } else {
        action = r.status;
        time = r.created_at;
      }

      const diffMs = Date.now() - new Date(time).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const timeAgo = diffMin < 1 ? 'just now' : diffMin < 60 ? `${diffMin}m ago` : `${Math.floor(diffMin / 60)}h ago`;

      return {
        vehicle: r.vehicle_number,
        action,
        slot: r.slot_number,
        timeAgo,
      };
    });

    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/public/grid — slot grid for live visualization, no auth
router.get('/grid', (req, res) => {
  try {
    const slots = db.prepare(
      'SELECT slot_number, floor, type, status FROM slots ORDER BY floor, slot_number'
    ).all();

    const floors = {};
    for (const slot of slots) {
      if (!floors[slot.floor]) floors[slot.floor] = [];
      floors[slot.floor].push({
        number: slot.slot_number,
        type: slot.type,
        status: slot.status,
      });
    }

    res.json(floors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grid' });
  }
});

module.exports = router;
