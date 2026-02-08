// backend-server/controllers/bookingController.js
const db = require('../db');
const jwt = require('jsonwebtoken');

// CREATE BOOKING (no availability checks — just insert)
exports.createBooking = async (req, res, next) => {
  try {
    const { customer_name, hotel_id, check_in, check_out } = req.body;

    // 1️⃣ Basic validation
    if (!customer_name || !hotel_id || !check_in || !check_out) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 2️⃣ Date validation
    const ci = new Date(check_in);
    const co = new Date(check_out);
    if (isNaN(ci) || isNaN(co) || ci >= co) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // 3️⃣ Get user id (guest allowed)
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    // 4️⃣ Get total rooms of hotel
    const [hotelRows] = await db.execute(
      'SELECT total_rooms FROM hotels WHERE id = ?',
      [hotel_id]
    );

    if (hotelRows.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const totalRooms = hotelRows[0].total_rooms;

    // 5️⃣ Count overlapping bookings
    const [countRows] = await db.execute(
      `
      SELECT COUNT(*) AS bookedRooms
      FROM bookings
      WHERE hotel_id = ?
        AND status = 'booked'
        AND (check_in < ? AND check_out > ?)
      `,
      [hotel_id, check_out, check_in]
    );

    const bookedRooms = countRows[0].bookedRooms;

    // 6️⃣ Availability check
    if (bookedRooms >= totalRooms) {
      return res.status(409).json({
        message: 'No rooms available for selected dates'
      });
    }

    // 7️⃣ Insert booking
    const [result] = await db.execute(
      `
      INSERT INTO bookings (user_id, customer_name, hotel_id, check_in, check_out, status)
      VALUES (?, ?, ?, ?, ?, 'booked')
      `,
      [userId, customer_name, hotel_id, check_in, check_out]
    );

    res.status(201).json({
      message: 'Booking successful',
      bookingId: result.insertId
    });

  } catch (err) {
    next(err);
  }
};


// NOTE: availability endpoint removed per request — if a route still references
// /api/bookings/availability you should remove that route mapping from routes,
// or you can keep a simple endpoint that returns total rooms (not implemented here).

// GET ALL BOOKINGS
exports.getAllBookings = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT b.id, b.user_id, b.customer_name, b.check_in, b.check_out, b.status, h.name AS hotel
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// GET LOGGED-IN USER BOOKINGS
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute(
      `SELECT b.id, b.user_id, b.customer_name, b.check_in, b.check_out, b.status, h.name AS hotel
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`, [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// CANCEL BOOKING
exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // require auth for cancelling
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required to cancel booking' });
    }
    const reqUserId = Number(req.user.id);
    const reqIsAdmin = !!req.user.isAdmin;

    // get owner
    const [rows] = await db.execute('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    const ownerIdRaw = rows[0].user_id;
    const ownerId = ownerIdRaw === null ? null : Number(ownerIdRaw);

    // allow cancelling if booking belongs to user OR user is admin
    if (ownerId === null) {
      // guest booking: only admin can cancel
      if (!reqIsAdmin) return res.status(403).json({ message: 'Not authorized to cancel this guest booking' });
    } else if (ownerId !== reqUserId && !reqIsAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel' });
    }

    await db.execute('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

// DELETE BOOKING (owner or admin)
exports.deleteBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // require auth
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const reqUserId = Number(req.user.id);
    const reqIsAdmin = !!req.user.isAdmin;

    // fetch booking owner
    const [rows] = await db.execute('SELECT user_id FROM bookings WHERE id = ?', [bookingId]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    const ownerIdRaw = rows[0].user_id;
    const ownerId = ownerIdRaw === null ? null : Number(ownerIdRaw);

    // permission: owner or admin (guest bookings only admin)
    if (ownerId === null) {
      if (!reqIsAdmin) return res.status(403).json({ message: 'Not authorized to delete this guest booking' });
    } else if (ownerId !== reqUserId && !reqIsAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await db.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
    return res.json({ message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};


