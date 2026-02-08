const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');

// 🔒 CREATE BOOKING (FIXED: authMiddleware added)
router.post('/', authMiddleware, bookingController.createBooking);

// 🔓 GET ALL BOOKINGS (admin/public)
router.get('/', bookingController.getAllBookings);

// 🔒 GET LOGGED-IN USER BOOKINGS
router.get('/my', authMiddleware, bookingController.getMyBookings);

// 🔒 CANCEL BOOKING
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// 🔒 DELETE BOOKING
router.delete('/:id', authMiddleware, bookingController.deleteBooking);

module.exports = router;
