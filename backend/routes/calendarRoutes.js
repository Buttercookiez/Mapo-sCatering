const express = require('express');
const router = express.Router();
const { getCalendarEvents } = require('../controllers/calendarController');

// Route: /api/calendar/events
router.get('/events', getCalendarEvents);

module.exports = router;