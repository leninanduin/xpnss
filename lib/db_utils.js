exports.getQueryParams =  function (params){
    var names = [],
        vals_i = [],
        vals = [];

    for (var i in params) {
        names.push(i);
        vals_i.push( '$'+names.length );
        vals.push(params[i]);
    }

    var d = {
        names_s: names.join(','),
        vals_i_s: vals_i.join(','),
        vals: vals
    }
    return d;
}