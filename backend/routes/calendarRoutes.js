const express = require('express');
const router = express.Router();
const {toggleBlockDate} = require('../controllers/calendarController');

router.post('/toggle-block', toggleBlockDate);

module.exports = router;