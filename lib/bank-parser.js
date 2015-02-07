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
                op_v.auth_num = msg.match(/\*\d{5,}/ig)[0];
                op_v.auth_num = op_v.auth_num.replace('*', '');
            } catch(e) { return {error: 'auth_num missing'} }
        break;
    }
    return op_v;
}
