var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

    passport.use('login', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
        passReqToCallback : true
    },
					    function(req, email, password, done) {
						// check in mongo if a user with username exists or not
						console.log("About to try a login");
						User.findOne({ email : { $regex : new RegExp('^' + email+'$', 'i')}  } ,
							     function(err, user) {
								 // In case of any error, return using the done method
								 if (err)
								     return done(err);
								 // Username does not exist, log the error and redirect back
								 if (!user){
								     console.log('User Not Found with email '+email);
								     return done(null, false, req.flash('message', 'User Not found.'));
								 }
								 // User exists but wrong password, log the error
								 if (!isValidPassword(user, password)){
								     console.log('Invalid Password');
								     return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
								 }

								 // User exists, password is OK ... but the account isn't activated.
								 if (!user.active) {
								     return done(null, false, req.flash('message', 'Your account is not activated. Contact the site administrator.'));
								 }

								 // User and password both match,
								 // update the lastLogin field for this user
								 var date = Date.now();
								 console.log("About to update the lastLogin field of user " + user._id + " to " + date);
								 User.update({_id: user._id} , {lastLogin : date, $inc: {numberOfLogin: 1}}, function (err, raw) {
								     if (err) return handleError(err);
								     console.log(' The raw response from MongoDB was ', raw);
								 });

								 //
								 // Initialize activity report for this session.
								 //
								 console.log("About to create an indicator for session '" + req.session.id + "'");
								 activityIndicator[req.session.id] = true;
								 
								 //
								 // Now the session is not anymore anonymous.
								 req.session.email = email;

								 // ... and return user from done method
								 // which will be treated like success
								 return done(null, user);
							     }
							    );

					    })
		);


    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    }

}
