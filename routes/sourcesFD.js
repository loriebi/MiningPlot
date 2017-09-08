var express = require('express');
var router = express.Router();

/* GET sources frequency distribution page. */
router.get('/', function(req, res, next) {
    res.render('sourcesFD', { title: 'Sources\' frequency distribution plot' });
});

module.exports = router;
