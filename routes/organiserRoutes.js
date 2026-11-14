const express = require('express');
const router = express.Router();
const {
  getAllOrganisers,
  getOrganiserById,
  createOrganiser,
  updateOrganiser,
  deleteOrganiser
} = require('../controllers/organiserController');
const {
  validateOrganiserBody,
  validateOrganiserId
} = require('../middleware/validateOrganiser');

// GET /organisers
router.get('/', getAllOrganisers);

// GET /organisers/:id
router.get('/:id', validateOrganiserId, getOrganiserById);

// POST /organisers
router.post('/', validateOrganiserBody, createOrganiser);

// PUT /organisers/:id
router.put('/:id', validateOrganiserId, validateOrganiserBody, updateOrganiser);

// DELETE /organisers/:id
router.delete('/:id', validateOrganiserId, deleteOrganiser);

module.exports = router;
