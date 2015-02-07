exports.isRegistered = function(email, client, def) {
    var query = client.query(
                {name:"is_registered",
                text:"select count(user_email) as n from registered_user where user_email=$1 limit 1",
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
    client.query('INSERT into registered_user (user_email, full_name, status, has_new_operation, last_operation_auth_num, registered_date) VALUES($1, $2, $3, $4, $5, $6);',[user.email, user.fullName, user.status, 0, "", new Date()  ] ,
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

exports.hasNewOperation = function(email, client, def) {
    var query = client.query({
                name:"has_new_operation",
                text:"select r.has_new_operation, r.last_operation_auth_num, c.date from registered_user r left join cash_operation c on c.auth_num = r.last_operation_auth_num where r.user_email = $1 limit 1;",
                values:[email]
            });
    query.on('row', function(row) {
        def.resolve(row);
    });
    return def.promise;
}