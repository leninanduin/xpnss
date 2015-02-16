var table = 'registered_user',
    dbUtils = require('./db_utils'),
    deferred = require('deferred'),
    def = deferred();

exports.isRegistered = function(email, client) {

    var query = client.query({
                name:'is_registered',
                text:'SELECT * FROM '+table+' WHERE user_email = $1 LIMIT 1',
                values:[email]
            });
    query.on('row', function(row) {
        def.resolve(row);
    }).on('error', function(error) {
        console.log(error);
        def.resolve({error:'DB error'});
    }).on('end', function(rs){
        if(!rs.rowCount){
            def.resolve(false);
        }
    });
    return def.promise;
}
//TODO: encrypt emails
exports.register = function(user, client, done) {
    var d = dbUtils.getQueryParams(user);
    client.query('INSERT INTO '+table+' ('+d.names_s+') VALUES('+d.vals_i_s+') RETURNING *;',d.vals ,
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
