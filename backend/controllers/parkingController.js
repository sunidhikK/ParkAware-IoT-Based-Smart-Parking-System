const db = require('../db/database');

function isPeakHour(date) {
  const istOffset = 5.5 * 60;
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % (24 * 60);
  const istHour = Math.floor(istMinutes / 60);
  return (istHour >= 9 && istHour < 11) || (istHour >= 17 && istHour < 20);
}

function calculateCharge(entryTime, exitTime) {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const durationMs = exit - entry;
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes <= 0) return { charge: 20, durationMinutes: 0, isPeak: false };

  const peak = isPeakHour(exit);
  const hourlyRate = peak ? 50 : 30;
  const perMinRate = hourlyRate / 60;

  let charge;
  if (durationMinutes <= 60) {
    charge = hourlyRate;
  } else {
    charge = hourlyRate + (durationMinutes - 60) * perMinRate;
  }

  charge = Math.max(20, Math.round(charge * 100) / 100);

  return { charge, durationMinutes: Math.round(durationMinutes * 100) / 100, isPeak: peak };
}

exports.exitParking = (req, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user.id;

    const record = db.prepare(
      `SELECT pr.*, s.slot_number, s.floor, s.type as slot_type
       FROM parking_records pr
       JOIN slots s ON pr.slot_id = s.id
       WHERE pr.id = ? AND pr.user_id = ? AND pr.status = 'active'`
    ).get(recordId, userId);

    if (!record) {
      return res.status(400).json({ error: 'No active parking record found' });
    }

    const exitTime = new Date().toISOString();
    const { charge, durationMinutes, isPeak } = calculateCharge(record.entry_time, exitTime);

    db.prepare(
      `UPDATE parking_records SET exit_time = ?, duration_minutes = ?, charge = ?, status = 'completed'
       WHERE id = ?`
    ).run(exitTime, durationMinutes, charge, recordId);

    db.prepare(
      `UPDATE slots SET status = 'available', reserved_by = NULL, reserved_at = NULL WHERE id = ?`
    ).run(record.slot_id);

    res.json({
      receipt: {
        id: recordId,
        vehicleNumber: record.vehicle_number,
        slotNumber: record.slot_number,
        floor: record.floor,
        slotType: record.slot_type,
        entryTime: record.entry_time,
        exitTime,
        durationMinutes,
        charge,
        isPeakRate: isPeak,
        rateApplied: isPeak ? '₹50/hr (Peak)' : '₹30/hr (Normal)'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process exit' });
  }
};

exports.getMyHistory = (req, res) => {
  try {
    const userId = req.user.id;
    const records = db.prepare(
      `SELECT pr.*, s.slot_number, s.floor, s.type as slot_type
       FROM parking_records pr
       JOIN slots s ON pr.slot_id = s.id
       WHERE pr.user_id = ?
       ORDER BY pr.created_at DESC`
    ).all(userId);

    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

exports.getActiveSession = (req, res) => {
  try {
    const userId = req.user.id;
    const record = db.prepare(
      `SELECT pr.*, s.slot_number, s.floor, s.type as slot_type
       FROM parking_records pr
       JOIN slots s ON pr.slot_id = s.id
       WHERE pr.user_id = ? AND pr.status IN ('active', 'reserved')
       ORDER BY pr.created_at DESC
       LIMIT 1`
    ).get(userId);

    res.json({ session: record || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

exports.getReceipt = (req, res) => {
  try {
    const recordId = req.params.id;
    const record = db.prepare(
      `SELECT pr.*, s.slot_number, s.floor, s.type as slot_type, u.name as customer_name, u.email as customer_email
       FROM parking_records pr
       JOIN slots s ON pr.slot_id = s.id
       JOIN users u ON pr.user_id = u.id
       WHERE pr.id = ? AND pr.status = 'completed'`
    ).get(recordId);

    if (!record) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Verify the user can see this receipt
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isPeak = isPeakHour(new Date(record.exit_time));

    res.json({
      receipt: {
        id: record.id,
        customerName: record.customer_name,
        customerEmail: record.customer_email,
        vehicleNumber: record.vehicle_number,
        slotNumber: record.slot_number,
        floor: record.floor,
        slotType: record.slot_type,
        entryTime: record.entry_time,
        exitTime: record.exit_time,
        durationMinutes: record.duration_minutes,
        charge: record.charge,
        isPeakRate: isPeak,
        rateApplied: isPeak ? '₹50/hr (Peak)' : '₹30/hr (Normal)'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};
