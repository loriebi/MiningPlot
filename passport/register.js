var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

/* Mail related stuff */
const config = require('config');
let crewEmail = config.crewEmail;

const nodemailer = require('nodemailer');

let smtpConfig = {
  host: 'smtp.obspm.fr',
  port: 587,
  secure : false,
  auth : {
    user: 'partemix@obspm.fr',
    pass: 'iems!o0mum'
  },
  logger:true
};

function sendRegistrationMail(user){
  let transporter = nodemailer.createTransport(smtpConfig);
  let htmlCrew = `A new account was just created with the following records :
  <ul>
  <li> email: ${user.email} </li>
  <li> institute : ${user.institution} </li>
  <li> status : ${user.status} </li>
  <li> active : ${user.active} </li>
  <li> creation date : ${user.creationDate} </li>
  </ul>

  <br/><br/>

  -- Artemix bot
  `;

  console.log("About to send this email :" + htmlCrew + " to : " + crewEmail);
  transporter.sendMail({
    from: "michel.caillat@obspm.fr",
    to: crewEmail,
    subject: "ARTEMIX -- User registration",
    html: htmlCrew
  });

  transporter.close();
};


function sendRegistrationAcknowledgmentMail(user) {
  let transporter = nodemailer.createTransport(smtpConfig);
  let htmlUser = `Your account was just created with the following records :
  <ul>
  <li> email: ${user.email} </li>
  <li> institute : ${user.institution} </li>
  <li> status : ${user.status} </li>
  <li> active : ${user.active} </li>
	<li> active : ${user.creationDate} </li>
  <li> _id : ${user._id} </li>
  </ul>

  <br/>
  We hope that you\'ll find ARTEMIX useful.
  <br/><br/>
  -- The ARTEMIX team.
  `;

  console.log("About to send this email :" + htmlUser + " to : " + user.email);
  transporter.sendMail({
    from: "michel.caillat@obspm.fr",
    to: user.email,
    subject: "ARTEMIX -- Your registration",
    html: htmlUser
  });

  transporter.close();

}

module.exports = function(passport){

	passport.use('register', new LocalStrategy({
		        usernameField: 'email',
						passwordField: 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            findOrCreateUser = function(){
                // find a user in Mongo with provided username
		console.log("About to register");
		
		// Don't forget to make the search for an existing email case-insensitive.
                User.findOne({ email : { $regex : new RegExp('^' + email+'$', 'i')}  }, function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log('Error in registration: '+err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
                        console.log('User already exists with email: '+email);
                        return done(null, false, req.flash('message','User Already Exists'));
                    } else {
                        // if there is no user with that email
                        // create the user
			if (!(password === req.param('passwordConfirmation'))) {
			    console.log('Password confirmation failure');
			    return done(null, false, req.flash('message','Password confirmation failure'));
			}

                        var newUser = new User();

                        // set the user's local credentials
                        newUser.email = req.param('email');
                        newUser.password = createHash(password);
                        newUser.institution = req.param('institution');
			newUser.active=true;
			newUser.status="passenger";
			newUser.creationDate=Date.now();

                        // save the user
                        newUser.save(function(err) {
                            if (err){
                                console.log('Error in Saving user: '+err);
                                throw err;
                            }
                            console.log('User Registration successful');
			    sendRegistrationMail(newUser);
			    sendRegistrationAcknowledgmentMail(newUser);
                            return done(null, newUser);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );

    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }
}
