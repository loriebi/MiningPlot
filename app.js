var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var Db = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;


var mongoose = require('mongoose');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var Session = require('./models/session');
var users = require('./routes/users');
var calibrators = require('./routes/calibrators');
var calibratorsFD = require('./routes/calibratorsFD');
var calibratorFD = require('./routes/calibratorFD');
var sources = require('./routes/sources');
var sourcesFD = require('./routes/sourcesFD');
var sourceFD = require('./routes/sourceFD');
var sourceFoV = require('./routes/sourceFoV');
var sourcesList = require('./routes/sourcesList');

var db = require('mongoskin').db('mongodb://vm-bdd-lerma01.obspm.fr:27017/NewMining');
mongoose.connect('mongodb://vm-bdd-lerma01.obspm.fr:27017/NewMining/');


var pureDb = new Db('NewMining', new Server('vm-bdd-lerma01.obspm.fr', 27017));
pureDb.open(function(err, pureDb) {
    if (err) 
	console.log("Could not open pureDb, error was "+err);
    else
	console.log("pureDb is opened");
});

//
// A config stored in config/default.json
var config = require('config');

var app = express();

//var basicAuth = require('basic-auth-connect');
//app.use(basicAuth('test', 'lerma'));

var store = new MongoStore({
    mongooseConnection: mongoose.connection,
    //ttl: 5 * 60, // 5 mins
});

// Configuring expressSession. Session duration.
var sessionDurationInMilliseconds = config.get("session.durationInMinutes") * 60 * 1000;
console.log("Session duration set to " + sessionDurationInMilliseconds + " milliseconds");
app.use(expressSession({
    secret: 'artemix.obspm.fr super secret key...',
    resave: true,
    saveUninitialized: true,
    cookie : {
        maxAge : sessionDurationInMilliseconds
    },
    store: store ,
    genid: function(req) {
	return (new mongoose.Types.ObjectId()).toString();
    }
}));

// Configuring Passport
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

store.on('create', function(req,res){
   //console.log('Session created', req.sessionID);
});

store.on('update', function(req,res){
    //console.log('Session updated', req.sessionID);
});

store.on('destroy', function(req,res){
    //console.log('Session destroyed', req.sessionID);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes/index')(passport);

app.get('/*', function(req, res, next) {
    console.log("Activity noticed on '" + req.session.id + "' for a get.");
    activityIndicator[req.session.id] = true;
    next();
});


app.post('/*', function(req, res, next) {
    console.log("Activity noticed on '" + req.session.id + "' for a post.");
    activityIndicator[req.session.id] = true;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/calibrators', calibrators);
app.use('/calibratorsFD', calibratorsFD);
app.use('/calibratorFD', calibratorFD);
app.use('/sources', sources);
app.use('/sourcesFD', sourcesFD);
app.use('/sourceFD', sourceFD);
app.use('/sourceFoV', sourceFoV);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


function flEqual(a, b, err) {
  return Math.abs(a - b) <= err;
}

function findRaDec(ra, dec, ras, decs) {
  var err = 1e-08;

  for (var i = 0; i < ras.length; ++i) {
    if (flEqual(ra, ras[i], err) && flEqual(dec, decs[i], err))
      return i
  }
  return -1
}


// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function ga2equ(ga) {
/*
"""
Convert Galactic to Equatorial coordinates (J2000.0)
(use at own risk)

Input: [l,b] in decimal degrees
Returns: [ra,dec] in decimal degrees

Source:
    - Book: "Practical astronomy with your calculator" (Peter Duffett-Smith)
- Wikipedia "Galactic coordinates"

Tests (examples given on the Wikipedia page):
>>> ga2equ([0.0, 0.0]).round(3)
array([ 266.405,  -28.936])
>>> ga2equ([359.9443056, -0.0461944444]).round(3)
array([ 266.417,  -29.008])
"""
*/
  var l = Math.radians(ga[0])
  var b = Math.radians(ga[1])

  //# North galactic pole (J2000) -- according to Wikipedia
  var pole_ra = Math.radians(192.859508)
  var pole_dec = Math.radians(27.128336)
  var posangle = Math.radians(122.932-90.0)

  /*
  # North galactic pole (B1950)
  #pole_ra = radians(192.25)
  #pole_dec = radians(27.4)
  #posangle = radians(123.0-90.0)
  */

  var ra = Math.atan2( (Math.cos(b) * Math.cos(l - posangle)),
                        (Math.sin(b) * Math.cos(pole_dec) - Math.cos(b) * Math.sin(pole_dec) * Math.sin(l - posangle)) )
            + pole_ra;
  var dec = Math.asin( Math.cos(b) * Math.cos(pole_dec) * Math.sin(l - posangle) + Math.sin(b) * Math.sin(pole_dec) );

  return [Math.degrees(ra), Math.degrees(dec)]
}


/*
    Add *val* to *ar*.
    Returns an array.
 */
function addToSet(ar, val) {
    if (Array.isArray(val)) {
        for (var i = 0; i < val.length; ++i) {
            addToSet(ar, val[i]);
        }
    }
    else
        if (ar.indexOf(val) < 0) {
            ar.push(val);
        }
    return ar;
}


/*
 Add *val* to *ar*.
 Returns an array.
 */
function addToArray(ar, val) {
    if (Array.isArray(val))
        Array.push.apply(ar, val);
    else
        ar.push(val);

    return ar;
}

function sum(ar) {
    return ar.reduce(function (a, b) { return a + b; }, 0);
}


function addObjects(oldList, newList, i) {
    for (var prop in newList) {
        switch (prop) {
            /*
            case "Integration":
                newList["Integration"][i] += oldList["Integration"]["value"];
                break;

            case "Frequency support":
                for (var s of oldList["Frequency support"]["value"].split('U')) {
                if (newList["Frequency support"][i].indexOf(s) === -1)
                    newList["Frequency support"][i] += " U " + s;
            }
                break;
            */
            case "Source name":
                break;
            /*
            case "raCal":
                break;
            case "Dec":
                break;
             */
            case "FoV": // TODO: Remove this after all sources have FoV field
                if (oldList.hasOwnProperty(prop)) {
                    addToSet(newList[prop][i], oldList[prop]["value"]);
                }
                else
                    addToSet(newList[prop][i], []);
                break;
            default:
                addToArray(newList[prop][i], oldList[prop]["value"]);
        }
    }
}

  var projects;

  db.collection('testMetadata').find({}, {_id: 0}).toArray(function(err, projects) {
      if (err) throw err;

      var sources = {};

      for(var prop in projects[0])
         sources[prop] = [];

      sources["FoV"] = []; // TODO: Remove this after all sources have FoV field


      for (var i in projects) {
        var project = projects[i];
        //project["RA"]["value"] /= 15;
        var ra = project["RA"]["value"];
        var dec = project["Dec"]["value"];
          var names = project["Source name"]["value"].split(';');

          for (var name of names)
          {
              //name = name.trim().toUpperCase();
              var ind = -1;

              /*sources["Source name"].some(function(element, ii) {
                  if (name === element.toUpperCase()) {
                      ind = ii;
                      return true;
                  }
              });*/

              if (ind > -1) {
                  addObjects(project, sources, ind);
              }
              else {
                  //var indRaDec = findRaDec(ra, dec, sources["RA"], sources["Dec"]);
                  var indRaDec = -1;

                  if (indRaDec > -1) {
                      addObjects(project, sources, indRaDec);
                  }
                  else {
                      for (var prop in project) {
                          if (sources.hasOwnProperty(prop)) {
                              if (prop === "Source name")
                                  sources[prop].push(name);
                              else {
                                  if (Array.isArray(project[prop]["value"]))
                                    sources[prop].push(project[prop]["value"]);
                                  else
                                      sources[prop].push([project[prop]["value"]]);
                              }
                          }
                          else
                              console.log("Sources has no property " + prop)
                      }
                      if (!project.hasOwnProperty("FoV")) { // TODO: Remove this after all sources have FoV field
                          sources["FoV"].push([]);
                      }
                  }
              }
          }
      }

      var sourcesNum = sources["Integration"].length;
      //var max = Math.max.apply(Math, sources["Integration"]);
      var integSq = []; //= sources["Integration"].slice();

      for (i = 0; i < sourcesNum; ++i) {
          //integSq.push(Math.log2(sum(sources["Integration"][i])));
          integSq.push(Math.sqrt(sum(sources["Integration"][i])/10));
      }

      var data = [];
      var foVs = [];

      for (i = 0; i < sourcesNum; ++i) {

          var freqSup = "";
          var freqSupsArray = [];
          var foV = [];

          for (j = 0; j < sources["Frequency support"][i].length; ++j) { //    var str of sources["Frequency support"][i]) {
              var str = sources["Frequency support"][i][j].split('U');
              var totalAv = 0;

              for (k = 0; k < str.length; ++k) { //  var s of str.split('U')) {
                  var s = str[k];
                  var start = parseFloat(s.split(',')[0].split('..')[0].trim().slice(1));
                  var end = parseFloat(s.split(',')[0].split('..')[1].trim().slice(0, -3));

                  totalAv += (start + end) / 2;

                  if (freqSup.indexOf(s) === -1) {
                      freqSupsArray.push([start, end]);
                  }
              }
              foV.push(totalAv / k);
          }

          foVs.push(foV);
          freqSupsArray.sort(function(a, b){ return a[0] - b[0] });
          var tmpArr = [freqSupsArray[0]];

          for (j = 1, k = 0; j < freqSupsArray.length; ++j) {
              if (tmpArr[k][1] < freqSupsArray[j][1]) {
                  if ((tmpArr[k][1] >= freqSupsArray[j][0]))
                      tmpArr[k][1] = freqSupsArray[j][1];
                  else {
                      tmpArr.push(freqSupsArray[j]);
                      ++k;
                  }
              }
          }

          freqSupsArray = tmpArr.slice();

          var numIter = freqSupsArray.length * 2 - data.length;

          for (j = 0; j < numIter; ++j) {
              data.push(Array.apply(null, Array(sourcesNum)).map(function() { return 0; }));
          }

          for (var j = 0, k = 0, base = 0; j < freqSupsArray.length; ++j, k += 2) {
              start = freqSupsArray[j][0];
              end = freqSupsArray[j][1];
              var barLen = end - start;
              data[k][i] = start - base;
              base = end;
              data[k+1][i] = barLen;
          }
      }

      var galaxy = {
          x: [],
          y: []
      };

      for (i = 118; i < 362; ++i) {
          var npoint = ga2equ([i, 0]);
          npoint[0] = npoint[0] % 360 / 15.;
          galaxy['x'].push(npoint[0]);
          galaxy['y'].push(npoint[1]);
      }

      for (i = 0; i < 117; ++i) {
          npoint = ga2equ([i, 0]);
          npoint[0] = npoint[0] % 360 / 15.;
          galaxy['x'].push(npoint[0]);
          galaxy['y'].push(npoint[1]);
      }

      app.locals.galaxy = galaxy;

      app.locals.pois = {
          x: [10, 2.6, 3.53, 14.28, 4.7, 5.58, 18.5, 16.5, 19, 17.8, 5.4, 0.86, 12.45, 14, 22.3, 3.5, 13.2, 0.61, 2.36],
          y: [2.2, 62.2, -28, 52.5, 25.9, -5.38, -2, -24.5, 1, -29, -69.75, -72.8, 12.70, 5, 0.4, -27.8, 29, -44, -4.75],
          name: ["COSMOS", "HDF", "ECDF", "EGS", "Taurus", "Orion", "Serpens", "Ophiuchus", "Aquila", "SgrA", "LMC", "SMC", "Virgo",
                    "VVDS-14h", "VVDS-22h", "ECDFS", "H-ATLAS (NGP)", "ELAIS-S1", "XMM-LSS"]
      };

      app.locals.sources = sources;
      app.locals.sourcesSize = integSq;
      app.locals.sourcesFD = data;
      app.locals.foVs = foVs;
    //  console.log(foVs);
      console.log("Finished loading sources data");

});


db.collection('testMetadata').find({}, {_id: 0}).toArray(function(err, projects) {
    if (err) throw err;

    var calibrators = {};

    for(var prop in projects[0])
        calibrators[prop] = [];


    for (var i in projects) {
        var project = projects[i];
        project["RA"]["value"] /= 15;
        var ra = project["RA"]["value"];
        var dec = project["Dec"]["value"];
        var names = project["Source name"]["value"].split(';');

        for (var name of names)
        {
            name = name.trim().toUpperCase();
            var ind = -1;

            calibrators["Source name"].some(function(element, ii) {
                if (name === element.toUpperCase()) {
                    ind = ii;
                    return true;
                }
            });

            if (ind > -1) {
                calibrators["Integration"][ind] += project["Integration"]["value"];

                for (var s of project["Frequency support"]["value"].split('U')) {
                    if (calibrators["Frequency support"][ind].indexOf(s) === -1)
                        calibrators["Frequency support"][ind] += " U " + s;
                }

                calibrators["Project code"][ind] = addToSet(calibrators["Project code"][ind], project["Project code"]["value"]);
                calibrators["PI name"][ind] = addToSet(calibrators["PI name"][ind], project["PI name"]["value"]);
            }
            else {
                var indRaDec = findRaDec(ra, dec, calibrators["RA"], calibrators["Dec"]);
                if (indRaDec > -1) {
                    calibrators["Integration"][indRaDec] += project["Integration"]["value"];

                    for (var s of project["Frequency support"]["value"].split('U')) {
                        if (calibrators["Frequency support"][indRaDec].indexOf(s) == -1)
                            calibrators["Frequency support"][indRaDec] += " U " + s;
                    }

                    calibrators["Project code"][indRaDec] = addToSet(calibrators["Project code"][indRaDec], project["Project code"]["value"]);
                    calibrators["PI name"][indRaDec] = addToSet(calibrators["PI name"][indRaDec], project["PI name"]["value"]);
                }
                else {
                    for (var prop in project) {
                        if (calibrators.hasOwnProperty(prop)) {
                            if(prop == "Source name")
                                calibrators[prop].push(name);
                            else {
                                if(prop == "Project code" || prop == "PI name")
                                    calibrators[prop].push([project[prop]["value"]]);
                                else
                                    calibrators[prop].push(project[prop]["value"]);
                            }
                        }
                        else
                            console.log("Calibrators has no property " + prop)
                    }
                }
            }
        }
    }

    var integSqCal = calibrators["Integration"].slice();

    for (var i in integSqCal) {
        integSqCal[i] = Math.sqrt(integSqCal[i]);
    }

    var data = [];

    for (var i in calibrators["Frequency support"]) {

        var freqSups = calibrators["Frequency support"][i].split('U');
        var freqSupsArray = [];

        for (var j = 0; j < freqSups.length; ++j) {
            var s = freqSups[j];
            var start = parseFloat(s.split(',')[0].split('..')[0].trim().slice(1));
            var end = parseFloat(s.split(',')[0].split('..')[1].trim().slice(0, -3));

            freqSupsArray.push([start, end]);
        }

        freqSupsArray.sort(function(a, b){ return a[0] - b[0] });
        var tmpArr = [freqSupsArray[0]];

        for (var j = 1, k = 0; j < freqSupsArray.length; ++j) {
            if (tmpArr[k][1] < freqSupsArray[j][1]) {
                if ((tmpArr[k][1] >= freqSupsArray[j][0]))
                    tmpArr[k][1] = freqSupsArray[j][1];
                else {
                    tmpArr.push(freqSupsArray[j]);
                    ++k;
                }
            }
        }

        freqSupsArray = tmpArr.slice();

        var numIter = freqSupsArray.length * 2 - data.length;

        for (var j = 0; j < numIter; ++j) {
            data.push(Array.apply(null, Array(integSqCal.length)).map(function() { return 0; }));
        }

        for (var j = 0, k = 0, base = 0; j < freqSupsArray.length; ++j, k += 2) {
            var start = freqSupsArray[j][0];
            var end = freqSupsArray[j][1];
            var barLen = end - start;
            data[k][i] = start - base;
            base = end;
            data[k+1][i] = barLen;
        }
    }

    app.locals.calibrators = calibrators;
    app.locals.calibratorsSize = integSqCal;
    app.locals.calibratorsFD = data;
    console.log("Finished loading calibrators data");
});


db.collection('testMetadata').find({}, {_id: 0}).toArray(function(err, projects) {
    if (err) throw err;

    var almaNameSet = new Set();
    var projectCodeSet = new Set();

    var almaNameList = [];
    var projectCodeList = [];

    for(var i in projects) {
        var project = projects[i];
        almaNameSet.add(project["Source name"]["value"]);
        projectCodeSet.add(project["Project code"]["value"]);
    }

    almaNameSet.forEach(function(item, sameItem, s){almaNameList.push(item)});
    projectCodeSet.forEach(function(item, sameItem, s){projectCodeList.push(item)});

    app.locals.almaNameList = almaNameList;
    app.locals.projectCodeList = projectCodeList;
    console.log("Finished loading almaNameList/projectCodeList data");

});


db.collection('NedObjects').find({}, {_id: 0}).toArray(function (err, nedObjects) {

    app.locals.nedObjects = nedObjects;
});

var freqs = require("./listFreq.json");
var freqsList = {};
freqsList["value"] = [];
freqsList["name"] = [];


for (var freq in freqs["data"]) {
    freqsList["value"].push(freqs["data"][freq]["value"]);
    freqsList["name"].push(freqs["data"][freq]["name"]);
}

app.locals.freqsList = freqsList;

/*
 * A per session activity indicator.
 */
activityIndicator = {};

/*
 * Schedule an action which checks the activity indicator at regular interval of times.
 */

function checkAndResetActivityIndicator() {
    console.log("Entering checkAndResetActivityIndicator");
    pureDb.collection("sessions", function(err, sessions) {
	for (var sessionId in activityIndicator ) {
	    console.log ("Checking session '" + sessionId + "'. " + typeof(sessionId));
	    if (activityIndicator[sessionId] === false) {
		console.log("Requesting for the removal of session '" + sessionId + "'");
		sessions.remove({_id: sessionId}, function (err, numberOfRemovedSessions) {
		    if (err) {
			console.log("Error at removal of session '" + sessionId + "' " + err);
		    }
		    else {
			console.log(numberOfRemovedSessions + " session destroyed");
		    }
		    delete activityIndicator[sessionId];
		});
	    }
	    else
		activityIndicator[sessionId] = false; 
	}
    });
    console.log("Exiting checkAndResetActivityIndicator");
};

var killAfterIdleMinutes = config.get("session.killAfterIdleMinutes");
console.log("A session will be destroyed after " + killAfterIdleMinutes * 60 * 1000 + " milliseconds of idleness.");

setInterval(checkAndResetActivityIndicator, killAfterIdleMinutes * 60 * 1000);

module.exports = app;

console.log("Server started.")
