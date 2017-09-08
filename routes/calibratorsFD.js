var express = require('express');
var router = express.Router();

/* GET calibrators frequency distribution page. */
router.get('/', function(req, res, next) {
    res.render('calibratorsFD', { title: 'Calibrators\' frequency distribution plot' });
});

module.exports = router;
