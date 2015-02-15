var table = 'registered_user';
exports.isRegistered = function(email, client, def) {
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
            //no rows
            def.resolve(false);
        }
    });
    return def.promise;
}
//TODO: encrypt emails
exports.register = function(user, client, d, def) {
    client.query('INSERT INTO '+table+' (user_email, full_name, gender, fs_at, fs_id, status, registered_date) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *;',[user.user_email, user.full_name, user.gender, user.fs_at, user.fs_id, "ACTIVE", new Date()] ,
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
