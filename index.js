var express = require('express')
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var bodyParser = require('body-parser')


app.set('port', (process.env.PORT || 5000))

app.get('/', function(request, response) {
    var result = ''
    response.send(cool());
});

app.get('/db', function (request, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            console.error(err); response.send("Error " + err);
        }
        if (client) {
            client.query('SELECT * FROM cash_operations', function(err, result) {
                done();
                if (err)
                { console.error(err); response.send("Error " + err); }
                else
                { response.send(result.rows); }
            });
        }
    });
});

// parse application/json
app.use(bodyParser.json())
app.post('/inbound', function(request, response){
    if (!request.body) {
        return response.sendStatus(400)
    }
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) {
            console.error(err); response.send("Error " + err);
        }
        if (client) {

            client.query('INSERT into cash_operations (from_e, text, date) VALUES($1, $2, $3)',[request.body.From, request.body.StrippedTextReply, request.body.Date ] ,
                function(err, result) {
                done();
                if (err)
                { console.error(err); response.send("Error " + err); }
            });
        }
    });

    response.json(request.body.StrippedTextReply);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});