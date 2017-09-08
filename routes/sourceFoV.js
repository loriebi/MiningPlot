var express = require('express');
var router = express.Router();
var Db = require('mongodb').Db,
    Server = require('mongodb').Server;

var db = new Db('NewMining', new Server('vm-bdd-lerma01.obspm.fr', 27017));

var pageID = [];




/* GET source frequency distribution page. */
router.get('/:search', function(req, res, next) {

    var id_ = req.params.search;
    var ind = -1;
    for(var i=0;i<pageID.length;i++){

        if(pageID[i].reqId === id_){
            ind = i;
            break;
        }
    }

    if(ind < 0){
        console.log("PAGE NOT FOUND!");
        res.redirect('/');
    }


    res.locals.reqType = pageID[ind].reqType;
    res.locals.data = pageID[ind].reqData;
    res.locals.RA = pageID[ind].RA;
    res.locals.DEC = pageID[ind].DEC;
    res.locals.Simbad = pageID[ind].Simbad;
    res.locals.pageName = "sourceFoV";

    res.render('sourceFoV', { title: 'Coverage',user: req.user });
});


router.post("/search/:proj_code", function(req,res,next){

    var proj_code = req.params.proj_code;
    var data;

    var timestamp = new Date().valueOf();

    data = req.body.searchProjectResult;
    if(typeof(data) === "string"){
        data = Array(data);
    }


    var reqId = {reqId : req.sessionID + '_' + timestamp, reqData : data, RA : req.body['RA'], DEC : req.body['DEC'],
        Simbad : req.body['Simbad'], reqType : "searchProject"};

    pageID.push(reqId);

    res.setHeader('Content-Type','application/json');
    res.send(JSON.stringify({ urlId : reqId["reqId"] }));

});


router.post("/search", function(req,res,next){
    var data;

    var timestamp = new Date().valueOf();
    data = req.body.searchResult;
    if(typeof(data) === "string"){
        data = Array(data);
    }

    var reqId = {reqId : req.sessionID + '_' + timestamp, reqData : data, RA : req.body['RA'], DEC : req.body['DEC'],
        Simbad : req.body['Simbad'], reqType : "searchName"
    };


    pageID.push(reqId);


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ urlId : reqId["reqId"] }));
});

router.post('/', function(req, res, next) {

    var method = req.body.method;
    var reqType = req.body.reqType;
    console.log(reqType);

    if(method === "getHeaders"){
        if(reqType === "searchName"){
            var data = req.body.data;


            if(typeof(data) === "string"){
                data = Array(data);
            }
            var objList = [];

            // for example : {$or:[{"Header.OBJECT":"M83"},{"Header.OBJECT":"m83"}]}
            for (var i in data){
                objList.push({"Header.OBJECT":data[i]});
            }


            var query = {
                $or:objList
            };


            db.open(function(err, db) {

                var collection = db.collection("HeadersDB2");
                // Peform a distinct query against the a field Header.OBJECT
                collection.find(query).toArray(function(err, objects) {
                    if (err) {
                        console.log(err);
                    } else {

                        console.log(objects.length);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({data: objects }));
                    }

                    db.close();
                });
            });
        }else{
            var data = req.body.data;
            var projCode = req.body.projCode;



            if(typeof(data) === "string"){
                data = Array(data);
            }

            var objList = [];


            db.open(function(err, db) {

                var collection = db.collection("HeadersDB2");

                var query = {"Path":  {$regex : projCode}}

                collection.find(query).toArray(function(err, objects) {
                    if (err) {
                        console.log(err);
                    } else {

                        console.log(objects.length);

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({data: objects }));
                    }

                    db.close();
                });
            });
        }
    }else{
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ }))
    }





});



module.exports = router;


