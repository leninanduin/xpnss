var express = require('express')
    , app = express()
    , pg = require('pg')
    , types = pg.types
    , bodyParser = require('body-parser')
    , passport = require('passport')
    , cookieParser = require('cookie-parser')
    , methodOverride = require('method-override')
    , session = require('express-session')
    , FoursquareStrategy = require('passport-foursquare').Strategy
    , bankC = require('./lib/bank')
    , foursquareC = require('./lib/foursquare')
    , browserC = require('./lib/browser')
    , userC = require('./lib/user');


types.setTypeParser(1114, function(stringValue) {return stringValue;});

//PASSPORT SETTINGS
var FOURSQUARE_CLIENT_ID = "SJWUBSC0ACELTRJRVT5SYYUQXGMKCRGME5JLA5TDJX0MO1BE"
var FOURSQUARE_CLIENT_SECRET = "3CK4B2U4GBQ1YQ2RQDTY5KHWBNZMZBCKSWGYSAN5BFSPJKCQ";

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new FoursquareStrategy({
        clientID: FOURSQUARE_CLIENT_ID,
        clientSecret: FOURSQUARE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/foursquare/callback"
    },function(accessToken, refreshToken, profile, done) {
        //TODO: this sould be in user or not?
        var user = {
                user_email: profile.emails[0].value,
                full_name: profile.name.givenName+" "+profile.name.familyName,
                gender: profile.gender,
                fs_at: accessToken,
                fs_id: profile.id
            };
        process.nextTick(function() {
            pg.connect(process.env.DATABASE_URL, function(err, client, done_p) {
                if (err) {
                    console.error(err);
                    return done({error: "DB error."}, null);
                }
                if (client) {
                    userC.isRegistered(user.user_email, client).done(function(rs_userIsRegistered){
                        if ( rs_userIsRegistered === false ){
                            console.log("new user");
                            userC.register(user, client, done_p).done(function(rs_userRegistered){
                                // console.log(rs_userRegistered);
                                return done(null, rs_userRegistered);
                            });
                        }else{
                            console.log('returning user');
                            // console.log(rs_userIsRegistered);
                            return done(null, rs_userIsRegistered);
                        }
                    });
                }
            });

        });
    }
));

// configure Express
app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser('weareallwildthings'));
app.use(methodOverride());
//TODO: use a real secret
app.use(session({
    secret: 'weareallwildthings',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

//APP PATH DEFINITION

app.get('/auth/foursquare', passport.authenticate('foursquare', {session: true}));

app.get('/auth/foursquare/callback',
    passport.authenticate('foursquare', { failureRedirect: '/' }),
    function(req, res) {
    // Successful authentication, redirect home.
    return res.redirect('/dashboard');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {return next();}
    res.redirect('/');
}

//home page
//TODO: UI
app.get('/', function(req, res) {
    console.log("/");
    return res.render('index');
});

//dashboard page
//TODO: UI & table & graphics
app.get('/dashboard', ensureAuthenticated, function(req, res) {
    console.log("/dashboard");
    // console.log(req.user);
    res.render('dashboard', { user: req.user } );
});

//hadle and store inconming emails
app.post('/inbound', function(req, res){
    if (!req.body) {
        return res.sendStatus(400);
    }
    var opv = bankC.getOperatonValues(req.body);

    if (!opv.error){
        pg.connect(process.env.DATABASE_URL, function(err, client, done_p) {
            if (err) {
                console.error(err);
                return res.json({error: "DB error."});
            }
            if (client) {
                // check if the user is registeren in the app DB, only emails from registered users are going to be sotored.
                userC.isRegistered(req.body.From, client).done(function(rs_userIsRegistered){
                    if ( rs_userIsRegistered!==false ) {
                        opv.user_email = req.body.From;
                        bankC.saveOperation(opv, client, done_p).done(function(rs_saveOperation){
                            console.log('new cash operation');
                            //TODO: search for checkins
                            return res.json(rs_saveOperation);
                        });
                    } else {
                        var msg = req.body.From + ' is not registered in the app DB';
                        return res.json({error:msg});
                    }
                });
            }
        });
    }else{
        return res.json(opv);
    }
});

//handle ans store checkins
app.post('/handle_fs_checkins', function(req, res){
    pg.connect(process.env.DATABASE_URL, function(err, client, done_p) {
        if (err) {
            console.error(err);
            return res.json({error: "DB error."});
        }
        if (client) {
            var checkin_json = JSON.parse(req.body.checkin),
                user_json = JSON.parse(req.body.user),
                checkin_rs;
            foursquareC.saveCheckin(checkin_json, client, done_p).done(function(rs_newCheckin) {
                console.log("new checkin!");
                checkin_rs = rs_newCheckin

                checkin_rs.user_email = user_json.contact.email;
                bankC.searchOperationForCheckhin(checkin_rs, client).done(function(rs_newOperation){
                    console.log('searchOperationForCheckhin');
                    var posible_auth_nums = [];
                    if (rs_newOperation.rowCount > 0){
                        for (var r in rs_newOperation.rows){
                            posible_auth_nums.push(rs_newOperation.rows[r].auth_num);
                        }
                        checkin_rs.posible_auth_nums = posible_auth_nums.join(',');
                        foursquareC.updateCheckin({id:checkin_rs.id, posible_auth_nums:checkin_rs.posible_auth_nums, is_procesed:true}, client, done_p).done(function(rs_updatedCheckin){
                            console.log('checkin updated');
                            return res.json(rs_updatedCheckin);
                        });
                    }else{
                        console.log('checkin not updated');
                        return res.json(checkin_rs);
                    }
                });
            });
        }
    });
});

//endpoint that the browser extension is goint to ask for new operations
app.post('/has_new_operations', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            console.error(err);
            return res.json({error: "DB error."});
        }
        if (client) {
            userC.isRegistered(req.body.user_email, client).done(function(rs_userIsRegistered){
                if (rs_userIsRegistered) {
                    bankC.searchOperationForBrowser(req.body.user_email, client).done(function(rs_newOperation){
                        return res.json(rs_newOperation);
                    });
                }else{
                    return res.json({error: "User is not registered."});
                }
            });
        }
    });
    // res.json(req.body);
});

//endpoint that the browser extension is goint to ask for new operations
app.post('/save_browser_events', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            console.error(err);
            return res.json({error: "DB error."});
        }
        if (client) {
            var ev = {
                auth_num:req.body.authNum,
                history_elements: req.body.historyItems
            };
            browserC.saveHistory(ev, client, done).done(function(rs_newHistory) {
                console.log("new event_browser!");
                return res.json(rs_newHistory);
            });
        }
    });
    // res.json(req.body);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});