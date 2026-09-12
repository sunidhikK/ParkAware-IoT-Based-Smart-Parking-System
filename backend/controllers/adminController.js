const db = require('../db/database');

exports.getStats = (req, res) => {
  try {
    const totalSlots = db.prepare('SELECT COUNT(*) as count FROM slots').get().count;
    const occupied = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'occupied'").get().count;
    const reserved = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'reserved'").get().count;
    const available = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'available'").get().count;

    const today = new Date().toISOString().split('T')[0];
    const revenueToday = db.prepare(
      `SELECT COALESCE(SUM(charge), 0) as total FROM parking_records
       WHERE status = 'completed' AND date(exit_time) = date(?)`
    ).get(today).total;

    const totalRevenue = db.prepare(
      `SELECT COALESCE(SUM(charge), 0) as total FROM parking_records WHERE status = 'completed'`
    ).get().total;

    const activeVehicles = db.prepare(
      "SELECT COUNT(*) as count FROM parking_records WHERE status = 'active'"
    ).get().count;

    // Long parked vehicles (>12 hours)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const longParked = db.prepare(
      `SELECT COUNT(*) as count FROM parking_records
       WHERE status = 'active' AND entry_time < ?`
    ).get(twelveHoursAgo).count;

    res.json({
      stats: {
        totalSlots,
        occupied,
        reserved,
        available,
        revenueToday: Math.round(revenueToday * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeVehicles,
        longParked
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

exports.getLogs = (req, res) => {
  try {
    const { date, vehicle, slot, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT pr.*, s.slot_number, s.floor, s.type as slot_type,
             u.name as customer_name, u.email as customer_email
      FROM parking_records pr
      JOIN slots s ON pr.slot_id = s.id
      JOIN users u ON pr.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM parking_records pr
      JOIN slots s ON pr.slot_id = s.id
      JOIN users u ON pr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (date) {
      query += ` AND date(pr.created_at) = date(?)`;
      countQuery += ` AND date(pr.created_at) = date(?)`;
      params.push(date);
      countParams.push(date);
    }
    if (vehicle) {
      query += ` AND pr.vehicle_number LIKE ?`;
      countQuery += ` AND pr.vehicle_number LIKE ?`;
      params.push(`%${vehicle}%`);
      countParams.push(`%${vehicle}%`);
    }
    if (slot) {
      query += ` AND s.slot_number LIKE ?`;
      countQuery += ` AND s.slot_number LIKE ?`;
      params.push(`%${slot}%`);
      countParams.push(`%${slot}%`);
    }

    const total = db.prepare(countQuery).get(...countParams).total;

    query += ` ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const records = db.prepare(query).all(...params);

    res.json({ records, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

exports.getRevenue = (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let query;
    if (period === 'weekly') {
      query = `
        SELECT strftime('%Y-W%W', exit_time) as period,
               SUM(charge) as revenue,
               COUNT(*) as transactions
        FROM parking_records
        WHERE status = 'completed' AND exit_time IS NOT NULL
        GROUP BY strftime('%Y-W%W', exit_time)
        ORDER BY period DESC
        LIMIT 12
      `;
    } else {
      query = `
        SELECT date(exit_time) as period,
               SUM(charge) as revenue,
               COUNT(*) as transactions
        FROM parking_records
        WHERE status = 'completed' AND exit_time IS NOT NULL
        GROUP BY date(exit_time)
        ORDER BY period DESC
        LIMIT 30
      `;
    }

    const data = db.prepare(query).all().reverse();

    res.json({ revenue: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
};

exports.overrideSlot = (req, res) => {
  try {
    const slotId = req.params.id;
    const { status } = req.body;

    if (!['available', 'occupied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "available" or "occupied"' });
    }

    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (status === 'available') {
      // If slot was occupied, complete any active records
      const activeRecord = db.prepare(
        `SELECT id, entry_time FROM parking_records WHERE slot_id = ? AND status IN ('active', 'reserved')`
      ).get(slotId);

      if (activeRecord) {
        const exitTime = new Date().toISOString();
        if (activeRecord.entry_time) {
          const durationMs = new Date(exitTime) - new Date(activeRecord.entry_time);
          const durationMinutes = Math.round((durationMs / (1000 * 60)) * 100) / 100;
          db.prepare(
            `UPDATE parking_records SET exit_time = ?, duration_minutes = ?, charge = 0, status = 'completed'
             WHERE id = ?`
          ).run(exitTime, durationMinutes, activeRecord.id);
        } else {
          db.prepare(
            `UPDATE parking_records SET status = 'cancelled' WHERE id = ?`
          ).run(activeRecord.id);
        }
      }

      db.prepare(
        `UPDATE slots SET status = 'available', reserved_by = NULL, reserved_at = NULL WHERE id = ?`
      ).run(slotId);
    } else {
      db.prepare(`UPDATE slots SET status = 'occupied' WHERE id = ?`).run(slotId);
    }

    res.json({ message: `Slot ${slot.slot_number} marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to override slot' });
  }
};

exports.exportCSV = (req, res) => {
  try {
    const { date, vehicle, slot } = req.query;

    let query = `
      SELECT pr.id, pr.vehicle_number, s.slot_number, s.floor, s.type as slot_type,
             u.name as customer_name, pr.entry_time, pr.exit_time,
             pr.duration_minutes, pr.charge, pr.status
      FROM parking_records pr
      JOIN slots s ON pr.slot_id = s.id
      JOIN users u ON pr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND date(pr.created_at) = date(?)`;
      params.push(date);
    }
    if (vehicle) {
      query += ` AND pr.vehicle_number LIKE ?`;
      params.push(`%${vehicle}%`);
    }
    if (slot) {
      query += ` AND s.slot_number LIKE ?`;
      params.push(`%${slot}%`);
    }

    query += ` ORDER BY pr.created_at DESC`;

    const records = db.prepare(query).all(...params);

    const headers = ['ID', 'Vehicle Number', 'Slot', 'Floor', 'Slot Type', 'Customer', 'Entry Time', 'Exit Time', 'Duration (min)', 'Charge (₹)', 'Status'];
    const csvRows = [headers.join(',')];

    for (const r of records) {
      csvRows.push([
        r.id,
        `"${r.vehicle_number}"`,
        r.slot_number,
        r.floor,
        r.slot_type,
        `"${r.customer_name}"`,
        r.entry_time || '',
        r.exit_time || '',
        r.duration_minutes || '',
        r.charge || '',
        r.status
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=parking-records.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};
