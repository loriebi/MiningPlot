var express = require('express');
var router = express.Router();
var User = require('../models/user');

var Db = require('mongodb').Db,
    Server = require('mongodb').Server;

var db = new Db('NewMining', new Server('vm-bdd-lerma01.obspm.fr', 27017));

/*
slice = 0;
x = 0;
y = 0;
*/

var zerorpc = require("zerorpc");

var client = new zerorpc.Client({'timeout': 200, 'heartbeatInterval': 5000000});
client.connect("tcp://romeo.obspm.fr:4244");

router.get('/', function(req, res, next) {

    res.locals.fitsFile = req.query.file ? req.query.file : "ALMA00000006.fits";
    var object = req.query.object ? req.query.object : null;

    if ( object ) {
	
	var newEntry = object+"::"+req.query.file;
	var indexOf = req.user.recentFiles.indexOf(newEntry);

	if (indexOf > -1) {
	    var dropped = req.user.recentFiles.splice(newEntry, 1);
	}

	req.user.recentFiles.unshift(newEntry);
	User.update({_id: req.user._id}, {recentFiles : req.user.recentFiles} , function (err, raw) {
	    if (err) return handleError(err);
	    console.log (' The raw response from MongoDB was', raw);
	});
    }

    res.locals.pageName = "sourceFD";
    res.render('sourceFD', { user: req.user,title: 'QL Viewer', fitsFile: res.locals.fitsFile });
});

router.post('/', function(req, res, next) {

    var method = req.body.method;
    var self = res;
    var header;



    if (method === "getHMSDMS") {
        var ra = req.body.ra;
        var dec = req.body.dec;


        client.invoke("degToHMSDMS", parseInt(ra), parseInt(dec), req.body.fileName, req.sessionID, function (error, res, more) {
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });

    }


    if (method === "getRangeHMS") {
        var startR = req.body.start;
        var endR = req.body.end;
        var step = req.body.step;
	
        client.invoke("rangeToHMS", startR, endR, step, req.body.fileName, req.sessionID, function (error, res, more) {
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });
    }

    if (method === "getRangeDMS") {
        startR = req.body.start;
        endR = req.body.end;
        step = req.body.step;

        client.invoke("rangeToDMS", startR, endR, step, req.body.fileName, req.sessionID, function (error, res, more) {
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });


    }

    if (method === "getHeader") {
        var fileName = req.body.name;

        client.invoke("setData", fileName, req.sessionID, function (error, res, more) {
            if (error) {
                var message = error.toString();
                console.log(message);
                self.setHeader('Content-Type', 'application/json');
                self.send(JSON.stringify({ error: message }));
            } else {
                header = JSON.parse(res);
                self.setHeader('Content-Type', 'application/json');
                self.send(JSON.stringify({ data: header }));
            }
        });

    }

    if(method === "getSlice"){
        var sliceB = req.body.slice ? req.body.slice : 0;
        step = parseInt(req.body.step) ? parseInt(req.body.step) : 1;

        client.invoke("getSlice", sliceB, step, req.body.fileName, req.sessionID, function(error, res, more) {
                console.log("getSlice: ");
                self.setHeader('Content-Type', 'application/json');
                self.send(JSON.stringify({ data: res }));
        });
    }
    if(method === "getAverage"){
        var zmin = parseInt(req.body.zmin) ? parseInt(req.body.zmin) : 0;
        var zmax = parseInt(req.body.zmax) ? parseInt(req.body.zmax) : null;
        step = parseInt(req.body.step) ? parseInt(req.body.step) : 1;

        client.invoke("getAverage", req.body.fileName, req.sessionID, step, zmin, zmax, function(error, res, more) {
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });
    }
    if(method === "getFreq") {
        var x = req.body.x ? req.body.x : 0;
        var y = req.body.y ? req.body.y : 0;

        client.invoke("getFreq", req.body.fileName, req.sessionID, parseInt(x), parseInt(y), function(error, res, more) {
            console.log("getFreq: ");
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });
    }

    if(method === "getFreqAverage"){
        var xmin = parseInt(req.body.xmin) ? parseInt(req.body.xmin) : 0;
        var ymin = parseInt(req.body.ymin) ? parseInt(req.body.ymin) : 0;
        var xmax = parseInt(req.body.xmax)|| null;
        var ymax = parseInt(req.body.ymax) || null;

 //       client.invoke("getFreqAverage", req.body.fileName, req.sessionID, xmin, xmax, ymin, ymax, function(error, res, more) {
	client.invoke("getFreqAverage", req.body.fileName, req.sessionID, ymin, ymax, xmin, xmax, function(error, res, more) {
            self.setHeader('Content-Type', 'application/json');
            self.send(JSON.stringify({ data: res }));
        });
    }

    if (method === "getObjects") {
        // Establish connection to db
        db.open(function(err, db) {

            var collection = db.collection("HeadersDB2");
            // Peform a distinct query against the a field Header.OBJECT
            collection.distinct('Header.OBJECT', function(err, objects) {
                if (err) {
                    console.log(err);
                } else {
                    self.setHeader('Content-Type', 'application/json');
                    self.send(JSON.stringify({ data: objects.sort(function (a, b) {
                            var aA = a.toUpperCase();
                            var bB = b.toUpperCase();
                            return (aA < bB) ? -1 : (aA > bB) ? 1 : 0;
                        })
                    }));
                }
              //  db.close();
            });
        });
    }
    if (method === "getFiles") {
        var object = req.body.object;

        // Establish connection to db
        db.open(function (err, db) {

            var collection = db.collection("HeadersDB2");

            // Peform a distinct query against the a field Path with field Header.OBJECT == object
            collection.distinct('Path', {"Header.OBJECT": object}, function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    self.setHeader('Content-Type', 'application/json');
                    self.send(JSON.stringify({data: files}));
                }
                db.close();
            });
        });
    }
    if (method === "getFitsHeader") {
        var path = req.body.path;

        // Establish connection to db
        db.open(function(err, db) {

            var collection = db.collection("HeadersDB2");

             // Find the corresponding entry in DB
             collection.find({"Path": path}, {fields: {"_id": 0}}).toArray(function(err, fitsHeader) {
                 if (err) {
                     console.log(err);
                 } else {
                     self.setHeader('Content-Type', 'application/json');
                     self.send(JSON.stringify({data: fitsHeader[0]}));
                 }
                db.close();
             });
        });
    }

    if (method === "getHistory") {
	self.setHeader('Content-Type', 'application/json');
	self.send(JSON.stringify({data: req.user.recentFiles}));
    }

});


module.exports = router;
