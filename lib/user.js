exports.isRegistered = function (email, client, def) {

    var checkUserQuery = "select count(user_email) as n from registered_user where user_email='"+email+"';";
    var query = client.query(checkUserQuery);
    var rs = 111;
    query.on('row', function(row) {
        rs = parseInt(row.n);
        def.resolve(rs);
    });
    return def.promise;
}
//TODO  encrypt emails
exports.register =function (user, client, d, def) {
    client.query('INSERT into registered_user (user_email, full_name, status, has_new_operation, last_operation_auth_num, registered_date) VALUES($1, $2, $3, $4, $5, $6)',[user.email, user.fullName, user.status, 0, "", new Date()  ] ,
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