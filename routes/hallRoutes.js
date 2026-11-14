const express = require('express');
const router = express.Router();
const {
  getAllHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall
} = require('../controllers/hallController');
const {
  validateHallBody,
  validateHallId
} = require('../middleware/validateHall');

// GET /halls (supports ?building=...)
router.get('/', getAllHalls);

// GET /halls/:id
router.get('/:id', validateHallId, getHallById);

// POST /halls
router.post('/', validateHallBody, createHall);

// PUT /halls/:id
router.put('/:id', validateHallId, validateHallBody, updateHall);

// DELETE /halls/:id
router.delete('/:id', validateHallId, deleteHall);

module.exports = router;
