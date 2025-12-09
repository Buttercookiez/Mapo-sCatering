const express = require('express');
const router = express.Router();
const { getCalendarData, toggleBlockDate} = require('../controllers/calendarController');

// Route: /api/calendar/events
router.get('/data', getCalendarData);
router.post('/toggle-block', toggleBlockDate);

module.exports = router;