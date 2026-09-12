const db = require('../db/database');
const { releaseExpiredReservations } = require('../db/database');

exports.getSlots = (req, res) => {
  try {
    releaseExpiredReservations();

    const { floor } = req.query;
    let slots;

    if (floor) {
      slots = db.prepare('SELECT * FROM slots WHERE floor = ? ORDER BY slot_number').all(floor);
    } else {
      slots = db.prepare('SELECT * FROM slots ORDER BY floor, slot_number').all();
    }

    // Add warning flags for long-parked vehicles
    const activeRecords = db.prepare(
      `SELECT slot_id, entry_time FROM parking_records WHERE status = 'active'`
    ).all();

    const longParkedSlots = new Set();
    const now = Date.now();
    for (const record of activeRecords) {
      const entryTime = new Date(record.entry_time).getTime();
      if ((now - entryTime) > 12 * 60 * 60 * 1000) {
        longParkedSlots.add(record.slot_id);
      }
    }

    slots = slots.map(slot => ({
      ...slot,
      longParked: longParkedSlots.has(slot.id)
    }));

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

exports.getSlot = (req, res) => {
  try {
    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.json({ slot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slot' });
  }
};

exports.reserveSlot = (req, res) => {
  try {
    releaseExpiredReservations();

    const slotId = req.params.id;
    const userId = req.user.id;
    const { vehicleNumber } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (slot.status !== 'available') {
      return res.status(400).json({ error: 'Slot is not available' });
    }

    // Check if user already has an active/reserved record
    const activeRecord = db.prepare(
      `SELECT id FROM parking_records WHERE user_id = ? AND status IN ('active', 'reserved')`
    ).get(userId);
    if (activeRecord) {
      return res.status(400).json({ error: 'You already have an active parking session' });
    }

    const now = new Date().toISOString();

    db.prepare(
      `UPDATE slots SET status = 'reserved', reserved_by = ?, reserved_at = ? WHERE id = ?`
    ).run(userId, now, slotId);

    db.prepare(
      `INSERT INTO parking_records (user_id, slot_id, vehicle_number, status, created_at)
       VALUES (?, ?, ?, 'reserved', ?)`
    ).run(userId, slotId, vehicleNumber, now);

    res.json({ message: 'Slot reserved. You have 15 minutes to check in.', slotId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reserve slot' });
  }
};

exports.checkinSlot = (req, res) => {
  try {
    const slotId = req.params.id;
    const userId = req.user.id;

    const record = db.prepare(
      `SELECT * FROM parking_records WHERE slot_id = ? AND user_id = ? AND status = 'reserved'`
    ).get(slotId, userId);

    if (!record) {
      return res.status(400).json({ error: 'No reservation found for this slot' });
    }

    const now = new Date().toISOString();

    db.prepare(`UPDATE slots SET status = 'occupied' WHERE id = ?`).run(slotId);
    db.prepare(
      `UPDATE parking_records SET status = 'active', entry_time = ? WHERE id = ?`
    ).run(now, record.id);

    res.json({ message: 'Checked in successfully', entryTime: now });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in' });
  }
};

exports.parkNow = (req, res) => {
  try {
    releaseExpiredReservations();

    const slotId = req.params.id;
    const userId = req.user.id;
    const { vehicleNumber } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (slot.status !== 'available') {
      return res.status(400).json({ error: 'Slot is not available' });
    }

    const activeRecord = db.prepare(
      `SELECT id FROM parking_records WHERE user_id = ? AND status IN ('active', 'reserved')`
    ).get(userId);
    if (activeRecord) {
      return res.status(400).json({ error: 'You already have an active parking session' });
    }

    const now = new Date().toISOString();

    db.prepare(
      `UPDATE slots SET status = 'occupied', reserved_by = ?, reserved_at = NULL WHERE id = ?`
    ).run(userId, slotId);

    db.prepare(
      `INSERT INTO parking_records (user_id, slot_id, vehicle_number, entry_time, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`
    ).run(userId, slotId, vehicleNumber, now, now);

    res.json({ message: 'Parked successfully', entryTime: now });
  } catch (err) {
    res.status(500).json({ error: 'Failed to park' });
  }
};
