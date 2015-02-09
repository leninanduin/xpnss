exports.isRegistered = function(email, client, def) {
    var query = client.query({
                name:"is_registered",
                text:"SELECT COUNT(user_email) AS n FROM registered_user WHERE user_email=$1 LIMIT 1",
                values:[email]
            });
    var rs;
    query.on('row', function(row) {
        rs = parseInt(row.n);
        def.resolve(rs);
    }).on('error', function(error) {
        console.log(error);
        def.resolve({error:'DB error'});
    });
    return def.promise;
}
//TODO: encrypt emails
exports.register = function(user, client, d, def) {
    client.query('INSERT INTO registered_user (user_email, full_name, status, registered_date) VALUES($1, $2, $3, $4);',[user.email, user.fullName, user.status, new Date()] ,
        function(err, result) {
            d();
            if (err) {
                def.resolve(err);
            }else{
                def.resolve(result);
            }
    });
    return def.promise;
}

exports.hasNewOperation = function(email, client, def, moment) {
    var query = client.query({
                name:"has_new_operation",
                text:"SELECT * FROM cash_operation WHERE user_email = $1 AND is_procesed = FALSE;",
                values:[email]
            });
    query.on('row', function(row, result) {
        row.t_start = moment(row.date).subtract(2, 'm').valueOf();
        row.t_end = moment(row.date).add(2, 'm').valueOf();
        result.addRow(row);
    }).on('end', function(result){
        delete result['fields', 'command', 'oid', '_parsers'];
        def.resolve(result);
    });
    return def.promise;
}