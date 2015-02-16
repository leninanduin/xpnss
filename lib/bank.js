var table = 'cash_operation',
    status_new = "NOT_PROCESED",
    time_format = 'YYYY-MM-DD HH:mm:ss',
    dbUtils = require('./db_utils'),
    moment = require('moment-timezone'),
    deferred = require('deferred'),
    def = deferred();


exports.getOperatonValues = function (oper) {
    var msg = oper.TextBody;
    var op_v = {ammount : 0,date : new Date(), auth_num : '', bank: '', type: ''}

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
                        op_v.ammount *= -1;
                        op_v.ammount = op_v.ammount.toFixed(2);
                    break;
                    case "Deposito":
                    break;
                }
            } catch(e) { return {error: 'type missing'} }

            //hr operacion
            try {
                var tmp_date = msg.match(/(\*)+\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} (A|P)M/ig)[0];
                tmp_date = tmp_date.replace('*', '');
                op_v.date = moment.tz(tmp_date, "DD-MM-YY hh:mm:ss A", "").format(time_format);

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

exports.saveOperation = function(op, client, done) {
    var d = dbUtils.getQueryParams(op);
    client.query('INSERT into cash_operation ('+d.names_s+') VALUES('+d.vals_i_s+') RETURNING *; ',d.vals ,
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
//
exports.searchOperationForBrowser = function(email, client) {
    var query = client.query({
                name:'has_new_operation',
                text:'SELECT * FROM '+table+' WHERE user_email = $1 AND procesed_type = $2;',
                values:[email, status_new]
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

exports.searchOperationForCheckhin = function(checkin, client) {

    var t_start = moment(checkin.created_at, time_format).subtract(2, 'm');
    var t_end = moment(checkin.created_at, time_format).add(2, 'm');

    var query = client.query({
                name:'has_new_operation',
                text:'SELECT auth_num, date FROM '+table+' WHERE user_email = $1 AND date >= $2 AND date < $3 AND procesed_type = $4;',
                values:[checkin.user_email, t_start.format(time_format), t_end.format(time_format), status_new]
            });
    query.on('row', function(row, result) {
        result.addRow(row);
    }).on('end', function(result){
        delete result['fields', 'command', 'oid', '_parsers'];
        def.resolve(result);
    }).on('error', function(error) {
        def.resolve({error:'DB error'});
    });
    return def.promise;
}