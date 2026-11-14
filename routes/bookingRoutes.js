const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingDetails,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const {
  validateBookingBody,
  validateBookingId
} = require('../middleware/validateBooking');

// GET /bookings
router.get('/', getAllBookings);

// GET /bookings/details (MUST be defined before /:id to prevent matching 'details' as an ID)
router.get('/details', getBookingDetails);

// GET /bookings/:id
router.get('/:id', validateBookingId, getBookingById);

// POST /bookings
router.post('/', validateBookingBody, createBooking);

// PUT /bookings/:id
router.put('/:id', validateBookingId, validateBookingBody, updateBooking);

// DELETE /bookings/:id
router.delete('/:id', validateBookingId, deleteBooking);

module.exports = router;
