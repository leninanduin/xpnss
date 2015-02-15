var table = 'event_checkin';
//TODO: encrypt user_id
exports.saveCheckin = function(json, moment, client, d, def) {
    var c = getCheckin(json, moment);
    if (c){
        client.query('INSERT INTO '+table+' (id, user_id, venue_id, venue_name, venue_icon, venue_category, created_at, is_procesed) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',[c.id, c.user_id, c.venue_id, c.venue_name, c.venue_icon, c.venue_category, c.created_at, false] ,
            function(err, result) {
                d();
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

function getCheckin(json, moment) {
    if (!json.id){return {error:"missing checin id"}};
    var n_checkin = {
        id: json.id,
        user_id: json.user.id,
        venue_id: json.venue.id,
        venue_name: json.venue.name,
        venue_primary_cat: {},
        venue_icon: '',
        venue_parent_cats:{},
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

exports.matchCheckin = function(operation_date, client, def) {

}

