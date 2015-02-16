var table = 'event_browser',
    deferred = require('deferred'),
    def = deferred();

exports.saveHistory = function(c, client, done) {
    client.query('INSERT INTO '+table+' (auth_num, history_elements ) VALUES($1, $2 )RETURNING *;',[c.auth_num, c.history_elements] ,
        function(err, result) {
            done();
            if (err) {
                def.resolve(err);
            }else{
                def.resolve(result.rows[0]);
            }
    });
    return def.promise;
}
