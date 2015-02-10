exports.isRegistered = function(email, client, def) {
    var query = client.query({
                name:"is_registered",
                text:"SELECT * FROM registered_user WHERE user_email = $1 LIMIT 1",
                values:[email]
            });
    query.on('row', function(row) {
        def.resolve(row);
    }).on('error', function(error) {
        console.log(error);
        def.resolve({error:'DB error'});
    }).on('end', function(rs){
        if(!rs.rowCount){
            //no rows
            def.resolve(false);
        }
    });
    return def.promise;
}
//TODO: encrypt emails
exports.register = function(user, client, d, def) {
    client.query('INSERT INTO registered_user (user_email, full_name, gender, fs_at, fs_id, status, registered_date) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *;',[user.user_email, user.full_name, user.gender, user.fs_at, user.fs_id, "ACTIVE", new Date()] ,
        function(err, result) {
            d();
            if (err) {
                def.resolve(err);
            }else{
                def.resolve(result.rows[0]);
            }
    });
    return def.promise;
}
//TODO: update user
exports.updateFs = function(user, client, d, def) {
    client.query('UPDATE registered_user set (fs_at, fs_id) = ($1, $2);',[user.email, user.fullName, user.status, new Date()] ,
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