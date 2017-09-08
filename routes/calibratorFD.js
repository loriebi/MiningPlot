var express = require('express');
var router = express.Router();

/* GET calibrator frequency distribution page. */
router.get('/', function(req, res, next) {
    res.locals.query = req.query;
    res.render('calibratorFD', { title: 'Calibrator frequency distribution plot' });
});

module.exports = router;
