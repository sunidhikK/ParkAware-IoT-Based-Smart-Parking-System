const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'parking.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_number TEXT NOT NULL UNIQUE,
    floor TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Regular',
    status TEXT NOT NULL DEFAULT 'available',
    reserved_by INTEGER,
    reserved_at DATETIME,
    FOREIGN KEY (reserved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS parking_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    vehicle_number TEXT NOT NULL,
    entry_time DATETIME,
    exit_time DATETIME,
    duration_minutes REAL,
    charge REAL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (slot_id) REFERENCES slots(id)
  );
`);

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin', 'admin@parking.com', adminPassword, 'admin'
    );

    const customerPassword = bcrypt.hashSync('customer123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Test Customer', 'customer@parking.com', customerPassword, 'customer'
    );

    console.log('✓ Default users seeded');
  }

  const slotCount = db.prepare('SELECT COUNT(*) as count FROM slots').get();
  if (slotCount.count === 0) {
    const floors = ['A', 'B', 'C'];
    const insertSlot = db.prepare('INSERT INTO slots (slot_number, floor, type) VALUES (?, ?, ?)');

    const seedSlots = db.transaction(() => {
      for (const floor of floors) {
        for (let i = 1; i <= 20; i++) {
          let type;
          if (i <= 14) type = 'Regular';
          else if (i <= 17) type = 'EV';
          else if (i <= 19) type = 'Handicap';
          else type = 'VIP';

          insertSlot.run(`${floor}${String(i).padStart(2, '0')}`, floor, type);
        }
      }
    });
    seedSlots();
    console.log('✓ 60 parking slots seeded across 3 floors');
  }

  // Seed some active parking sessions & recent history
  const recordCount = db.prepare('SELECT COUNT(*) as count FROM parking_records').get();
  if (recordCount.count === 0) {
    const customer = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@parking.com');
    if (customer) {
      const seedRecords = db.transaction(() => {
        // Occupied slots — active sessions with different entry times
        const occupiedSlots = [
          { slot: 'A02', vehicle: 'KA-01-AB-1234', hoursAgo: 2.5 },
          { slot: 'A05', vehicle: 'KA-05-CD-5678', hoursAgo: 1.2 },
          { slot: 'A09', vehicle: 'KA-03-EF-9012', hoursAgo: 4.0 },
          { slot: 'A12', vehicle: 'KA-02-GH-3456', hoursAgo: 0.5 },
          { slot: 'B01', vehicle: 'KA-09-IJ-7890', hoursAgo: 3.1 },
          { slot: 'B04', vehicle: 'KA-11-KL-2345', hoursAgo: 6.0 },
          { slot: 'B08', vehicle: 'KA-07-MN-6789', hoursAgo: 1.8 },
          { slot: 'B13', vehicle: 'KA-14-OP-0123', hoursAgo: 0.3 },
          { slot: 'B16', vehicle: 'KA-08-QR-4567', hoursAgo: 2.0 },
          { slot: 'C03', vehicle: 'KA-10-ST-8901', hoursAgo: 5.5 },
          { slot: 'C07', vehicle: 'KA-06-UV-2345', hoursAgo: 0.8 },
          { slot: 'C11', vehicle: 'KA-12-WX-6789', hoursAgo: 1.5 },
          { slot: 'C14', vehicle: 'KA-04-YZ-0123', hoursAgo: 3.7 },
          { slot: 'C18', vehicle: 'KA-15-AB-4567', hoursAgo: 7.2 },
          { slot: 'A15', vehicle: 'KA-13-CD-8901', hoursAgo: 2.3 },
        ];

        for (const occ of occupiedSlots) {
          const slot = db.prepare('SELECT id FROM slots WHERE slot_number = ?').get(occ.slot);
          if (slot) {
            const entryTime = new Date(Date.now() - occ.hoursAgo * 3600000).toISOString();
            db.prepare('UPDATE slots SET status = ?, reserved_by = ? WHERE id = ?').run('occupied', customer.id, slot.id);
            db.prepare(
              'INSERT INTO parking_records (user_id, slot_id, vehicle_number, entry_time, status) VALUES (?, ?, ?, ?, ?)'
            ).run(customer.id, slot.id, occ.vehicle, entryTime, 'active');
          }
        }

        // Completed sessions — recent exits for activity feed
        const completedSessions = [
          { slot: 'A03', vehicle: 'KA-16-EF-1111', minsAgo: 5, duration: 45, charge: 55 },
          { slot: 'B10', vehicle: 'KA-17-GH-2222', minsAgo: 12, duration: 120, charge: 130 },
          { slot: 'C06', vehicle: 'KA-18-IJ-3333', minsAgo: 23, duration: 90, charge: 85 },
          { slot: 'A08', vehicle: 'KA-19-KL-4444', minsAgo: 38, duration: 60, charge: 50 },
          { slot: 'B15', vehicle: 'KA-20-MN-5555', minsAgo: 55, duration: 180, charge: 200 },
        ];

        for (const sess of completedSessions) {
          const slot = db.prepare('SELECT id FROM slots WHERE slot_number = ?').get(sess.slot);
          if (slot) {
            const exitTime = new Date(Date.now() - sess.minsAgo * 60000).toISOString();
            const entryTime = new Date(Date.now() - sess.minsAgo * 60000 - sess.duration * 60000).toISOString();
            db.prepare(
              `INSERT INTO parking_records (user_id, slot_id, vehicle_number, entry_time, exit_time, duration_minutes, charge, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`
            ).run(customer.id, slot.id, sess.vehicle, entryTime, exitTime, sess.duration, sess.charge, );
          }
        }

        // One reserved slot
        const resSlot = db.prepare('SELECT id FROM slots WHERE slot_number = ?').get('A20');
        if (resSlot) {
          db.prepare('UPDATE slots SET status = ?, reserved_by = ?, reserved_at = ? WHERE id = ?')
            .run('reserved', customer.id, new Date(Date.now() - 5 * 60000).toISOString(), resSlot.id);
          db.prepare(
            'INSERT INTO parking_records (user_id, slot_id, vehicle_number, status) VALUES (?, ?, ?, ?)'
          ).run(customer.id, resSlot.id, 'KA-21-OP-6666', 'reserved');
        }
      });
      seedRecords();
      console.log('✓ Pre-occupied 15 slots with active sessions + 5 completed + 1 reserved');
    }
  }
}

function releaseExpiredReservations() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const expiredSlots = db.prepare(
    `SELECT id FROM slots WHERE status = 'reserved' AND reserved_at < ?`
  ).all(fifteenMinutesAgo);

  if (expiredSlots.length > 0) {
    const slotIds = expiredSlots.map(s => s.id);

    db.prepare(
      `UPDATE slots SET status = 'available', reserved_by = NULL, reserved_at = NULL
       WHERE status = 'reserved' AND reserved_at < ?`
    ).run(fifteenMinutesAgo);

    db.prepare(
      `UPDATE parking_records SET status = 'expired'
       WHERE status = 'reserved' AND slot_id IN (${slotIds.join(',')})`
    ).run();

    console.log(`✓ Released ${expiredSlots.length} expired reservations`);
  }
}

seedDatabase();

setInterval(releaseExpiredReservations, 60 * 1000);

module.exports = db;
module.exports.releaseExpiredReservations = releaseExpiredReservations;
