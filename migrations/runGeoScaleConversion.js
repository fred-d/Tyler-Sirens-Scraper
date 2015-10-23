var r                  = require('rethinkdb');
var util               = require('./../src/util.js');
var trainingRegression = require('./../training/scales.json');

var makeScale = function(scale) {
    return function(call) {
        return call.mul(trainingRegression[scale].b).add(trainingRegression[scale].a);
    };
};

var xScale = makeScale('geoXScale');
var yScale = makeScale('geoYScale');

r.connect(util.makeConnection())
    .then(function(connection) {
        return r.db('TylerSirens')
            .table('calls')
            .update(function(call) {
                var lat = yScale(call('geoY'));
                var lng = xScale(call('geoX'));
                
                return call.merge({
                    lat: lat,
                    lng: lng,
                    location: r.point(lng, lat)
                });
            })
            .run(connection)
            .then(function() {
                connection.close()
            });
    });
