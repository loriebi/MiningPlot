var express = require('express');
var router = express.Router();

/* GET sources page. */
router.get('/', function(req, res, next) {

    res.locals.pageName = "sources";
    res.render('sources', { title: 'ALMA targets', user: req.user });
});

module.exports = router;
