var express = require('express');
var router = express.Router();

/* GET calibrators page. */
router.get('/', function(req, res, next) {
    res.render('calibrators', { title: 'Calibrators plot' });
});

module.exports = router;
