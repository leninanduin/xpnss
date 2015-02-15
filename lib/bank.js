var table = 'cash_operation';
exports.getOperatonValues = function (oper, moment) {
    var msg = oper.TextBody;
    var op_v = {ammount : 0,type : '',date : new Date(), auth_num : '', bank: '', operation_type: '', user_has_new_operation: 0}

    //banco
    try {
        op_v.bank = msg.match(/@\w+.\w+>/ig)[0];
        op_v.bank = op_v.bank.replace(/@|>/ig, '').toLowerCase();
    } catch(e) { return {error: 'bank missing'} }

    switch(op_v.bank) {
        case 'banamex.com':
            //ammount de la operacion
            try {
                op_v.ammount = msg.match(/(\d{1,3}(\,\d{3})*|(\d+))(\.\d{0,2})+?/g)[0];
                op_v.ammount = op_v.ammount.replace(/,/ig, '');
            } catch(e) { return {error: 'ammount missing'} }

            //type de operacion
            try {
                op_v.type = oper.Subject.match(/(retiro\/compra)|(deposito)/ig)[0];
                switch (op_v.type){
                    case "Retiro/Compra":
                        op_v.operation_type = "-";
                        op_v.ammount *= -1;
                        op_v.ammount = op_v.ammount.toFixed(2);
                        op_v.user_has_new_operation = 1;
                    break;
                    case "Deposito":
                        op_v.operation_type = "+";
                    break;
                }
            } catch(e) { return {error: 'type missing'} }

            //hr operacion
            try {
                var tmp_date = msg.match(/(\*)+\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} (A|P)M/ig)[0];
                tmp_date = tmp_date.replace('*', '');
                op_v.date = moment.tz(tmp_date, "DD-MM-YY hh:mm:ss A", "");

            } catch(e) { return {error: 'date missing'} }

            //# operacion
            try {
                op_v.auth_num = msg.match(/\*\d{4,}/ig)[0];
                op_v.auth_num = op_v.auth_num.replace('*', '');
            } catch(e) { return {error: 'auth_num missing'} }
        break;
    }
    return op_v;
}

exports.saveOperation = function(o, client, d, def) {
    client.query('INSERT into cash_operation (user_email, ammount, type, auth_num, date, bank, is_procesed ) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *; ',[o.user_email, o.ammount, o.type, o.auth_num, o.date, o.bank, false ] ,
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

exports.userHasNewOperation = function(email, client, def, moment) {
    var query = client.query({
                name:'has_new_operation',
                text:'SELECT * FROM '+table+' WHERE user_email = $1 AND is_procesed = FALSE;',
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

