var express = require('express');
var router = express.Router();

router.get('/', isAuthenticated, function(req, res, next) {
  User.find({}, function(err, users) {
    users.forEach(function(user) {
      console.log('User found: ' + user);
    });
  });
});
