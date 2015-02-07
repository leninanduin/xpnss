var express = require('express')
var app = express();
// var cool = require('cool-ascii-faces');
var pg = require('pg');
var types = pg.types;
types.setTypeParser(1114, function(stringValue) {return stringValue;});

var bodyParser = require('body-parser');
var moment = require('moment-timezone');
var deferred = require('deferred');
var stormpath = require('express-stormpath');

var bankParser = require('./lib/bank-parser');
var userF = require('./lib/user');

app.use(stormpath.init(app, {
    apiKeyId:     process.env.STORMPATH_API_KEY_ID,
    apiKeySecret: process.env.STORMPATH_API_KEY_SECRET,
    secretKey:    process.env.STORMPATH_SECRET_KEY,
    application:  process.env.STORMPATH_URL,
    enableAccountVerification: true,
    enableForgotPassword: true
}));

app.set('port', (process.env.PORT || 5000));
// parse application/json
app.use(bodyParser.json());

//dashboard page
app.get('/', stormpath.loginRequired, function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done_p) {
        if (err) {
            console.error(err); res.json({error: "DB error."});
        }
        if (client) {
            // check if the user is registeren in the app DB
            userF.isRegistered(req.user.email, client, deferred()).done(function(rs_userIsRegistered){
                console.log('UserIsRegistered: ',rs_userIsRegistered);
                // new user
                if (rs_userIsRegistered == 0) {
                    userF.register(req.user, client, done_p, deferred()).done(function(rs_NewUser){
                        if (newUser.name == 'error'){
                            console.log("Error creating the new user: ");
                            console.log(rs_NewUser);
                        }else{
                            console.log("User was registered!")
                        }
                    });
                }
            });
            //the user is already registered at this point
        }
    });

    console.log('User:', req.user.email, 'just accessed the /dashboard page!');
    res.send('Welcome!');
});

//process and stores inconming emails
app.post('/inbound', function(req, res){
    if (!req.body) {
        return res.sendStatus(400)
    }
    var opv = bankParser.getOperatonValues(req.body, moment);

    if (!opv.error){
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                console.error(err);
                res.json({error: "DB error."});
            }
            if (client) {
                // check if the user is registeren in the app DB, only emails from registered users are going to be sotored.
                userF.isRegistered(req.body.From, client, deferred()).done(function(rs_userIsRegistered){
                    if (rs_userIsRegistered===1) {
                        client.query('INSERT into cash_operation (user_email, ammount, type, auth_num, date, bank ) VALUES($1, $2, $3, $4, $5, $6); ',[req.body.From, opv.ammount, opv.type, opv.auth_num, opv.date, opv.bank  ] ,
                            function(err, result) {
                                if( opv.user_has_new_operation === 1 ){
                                    // the user has a new operation, we update the DB in order that the browser extension can make his work
                                    console.log("the user has a new operation");
                                    client.query('UPDATE registered_user SET (has_new_operation, last_operation_auth_num) = ($1, $2); ',[opv.user_has_new_operation, opv.auth_num ] , function(err, result) { done();
                                        if (err)
                                        { console.error(err); }
                                    });
                                }
                            done();
                            if (err)
                            { console.error(err); }
                        });
                    } else {
                        console.log(req.body.From, ' is not registered in the app DB');
                    }
                });
            }
        });
    }
    res.json(opv);
});

//endpoint that the browser extension is goint to ask for new operations
app.post('/has_new_operations', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            console.error(err);
            res.json({error: "DB error."});
        }
        if (client) {
            userF.isRegistered(req.body.user_email, client, deferred()).done(function(rs_userIsRegistered){
                if (rs_userIsRegistered===1) {
                    userF.hasNewOperation(req.body.user_email, client, deferred()).done(function(rs_hasNewOperation){
                        console.log(rs_hasNewOperation);
                        res.json(rs_hasNewOperation);
                    });
                }else{
                    res.json({error: "User is not registered."});
                }
            });
        }
    });
    // res.json(req.body);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});