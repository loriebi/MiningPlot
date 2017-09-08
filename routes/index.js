var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Session = require('../models/session');

/*
 * Routes and Methods
 */

/* GET home page. */
router.get('/', function(req, res, next) {
    var user_ ;
    if (req.user) {
	user_ = req.user;
    }
    else {
	user_ = {email: '_', status: '_'};
    }
    console.dir(user_);
    res.render('index', { title: 'Home page', user: user_ , pageName: 'Home page', link: '/'} );
});

var isAuthenticated = function (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated() && req.user.active) {
	return next();
    }
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/login');
}

module.exports = function(passport){



    /* GET login page. */
    router.get('/login', function(req, res) {
	// Display the Login page with any flash message, if any
	res.render('login', { message: req.flash('message') });
    });

    /* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash : true,
	resave : true,
	saveUninitialized : false
    }));

    /* GET Registration Page */
    router.get('/register', function(req, res){
	res.render('register',{message: req.flash('message')});
    });

    /* Handle Registration POST */
    router.post('/register', passport.authenticate('register', {
	successRedirect: '/login',
	failureRedirect: '/register',
	failureFlash : true,
	resave : true,
	saveUninitialized : false
    }));

    /* Handle Logout */
    router.get('/logout', function(req, res) {
	if (req.session.id in activityIndicator) delete activityIndicator[req.session.id];
	req.session.destroy();
	req.logout();
	res.redirect('/');
    });

    router.get('/sources', isAuthenticated, function(req,res,next) {
	next();
    });

    router.get('/sourceFD', isAuthenticated, function(req, res, next) {
	next();
    });

    router.get('/sourcesFD', isAuthenticated, function(req, res) {
	res.render('sourcesFD', {user: req.user, title: 'Fields of view'});
    })

    router.get('/sourceFoV/:search', function(req, res, next) {
	next();
    });
    /**
     * Handle a get userAdmin -> displays the users administration table/form.
     */
    router.get('/userAdmin', isAuthenticated, function(req, res){
	if ( req.query.delete ) {
	    let email2delete = req.query.delete;
	    User.findOne({email: email2delete})
		.exec(function (err, doc) {
		    if (err) {
			message = 'Error in signature deletion : ' +err;
			return console.error(message);
		    }
		    if (doc) doc.remove();
		    User.find({}, function(err, users) {
			res.render('userAdmin', {user: req.user, title: 'Users administration', users:users, pageName:'userAdmin'});
			return;
		    });
		});
	}
	else {
	    User.find({}, function(err, users) {
		users.forEach(function(user) {
		    console.log('User found: ' + user);
		});
		res.render('userAdmin', {user: req.user, title: 'Users administration', users: users, pageName:'userAdmin'});
	    });
	}
    });


    /**
     *  Handle a post userAdmin -> update the users collection accordingly with the content of the users administration table/form.
     */
    router.post('/userAdmin', function (req, res) {
	console.log('userAdmin received a post method call');
	i = 0;
	req.body.email.forEach(function(email) {
	    User.update({email: req.body.email[i]}, {active : req.body.active[i], status: req.body.status[i]}, function (err, raw) {
		if (err) return handleError(err);
		console.log(' The raw response from MongoDB was ', raw);
	    })
	    i = i + 1;
	});
	res.redirect('/userAdmin');
    });
    
    
    /**
     * Who is logged in ?
     */
    router.get('/who', isAuthenticated, function (req, res) {
	console.log("who received a get method call");
	var sessions_js=[];	
	Session.find({}, function(err, sessions) {
	    sessions.forEach(function(s) {
		console.log(s._id);
		let expires = s.expires;
		let id = s._id;
		let dict = JSON.parse(s.session);
		email = "anonymous";
		if ("email" in dict) {
		    email = dict["email"];
		    d = {"email":email, "expires":expires, "id": id};
		    sessions_js.push({"email":email, "expires":expires, "id":id});

		}
	    });
	    res.render('who', { user:req.user, title:'Sessions', sessions:sessions_js,  pageName:'Who'});
	});
    });
    
    return router;
}

