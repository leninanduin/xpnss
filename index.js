var express = require('express')
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var bodyParser = require('body-parser');
var moment = require('moment');
var bankParser = require('./lib/bank-parser');


app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
    var result = ''
    response.send(cool());
});

// parse application/json
app.use(bodyParser.json())
app.post('/inbound', function(request, response){
    if (!request.body) {
        return response.sendStatus(400)
    }
    var opv = bankParser.getOperatonValues(request.body, moment);

    if (!opv.error){
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                console.error(err); response.send("Error " + err);
            }
            if (client) {
                client.query('INSERT into cash_operations (user_email, ammount, type, auth_num, date, bank ) VALUES($1, $2, $3, $4, $5, $6)',[request.body.From, opv.ammount, opv.type, opv.auth_num, opv.date, opv.bank  ] ,
                    function(err, result) {
                    done();
                    if (err)
                    { console.error(err); response.send("Error " + err); }
                });
            }
        });
    }

    response.json(opv);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});