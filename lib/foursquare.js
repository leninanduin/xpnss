var table = 'event_checkin',
    dbUtils = require('./db_utils'),
    moment = require('moment-timezone'),
    deferred = require('deferred'),
    def = deferred();

function getCheckin(json) {
    if (!json.id){return {error:"missing checin id"}};
    var n_checkin = {
        id: json.id,
        user_id: json.user.id,
        venue_id: json.venue.id,
        venue_name: json.venue.name,
        venue_icon: '',
        venue_category: {},
        created_at: moment.unix(json.createdAt).tz(json.timeZone).format()
    };
    for(var i in json.venue.categories) {
        var cat = json.venue.categories[i];
        if( cat.primary === true ) {
            n_checkin.venue_category = {
                id: cat.id,
                name: cat.name,
                parents: cat.parents
            };
            n_checkin.venue_icon = cat.icon;
            break;
        }
    }
    return n_checkin;
}
//TODO: encrypt user_id
exports.saveCheckin = function(json, client, done) {
    var c = getCheckin(json);
    if (c){
        var d = dbUtils.getQueryParams(c);
        client.query('INSERT INTO '+table+' ('+d.names_s+') VALUES('+d.vals_i_s+') RETURNING *;',d.vals,
            function(err, result) {
                done();
                if (err) {
                    def.resolve(err);
                }else{
                    def.resolve(result.rows[0]);
                }
        });
    }else{
        def.resolve(c);
    }
    return def.promise;
}

exports.updateCheckin = function(params, client, done) {

    var d = dbUtils.getQueryParams(params);

    var q = 'UPDATE '+table+' SET('+d.names_s+') = ('+d.vals_i_s+')  WHERE id = \''+params.id+'\' RETURNING *;';
    client.query(q, d.vals, function(err, result) {
            done();
            if (err) {
                def.resolve(err);
            }else{
                def.resolve(result.rows[0]);
            }
    });
    return def.promise;
}

