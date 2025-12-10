const express = require('express');
const router = express.Router();
const {getPublicCalendarData, toggleBlockDate} = require('../controllers/calendarController');

router.get('/data', getPublicCalendarData);
router.post('/toggle-block', toggleBlockDate);

module.exports = router;