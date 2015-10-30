var r                  = require('rethinkdb');
var util               = require('./src/util.js');
var Promise            = require('bluebird');
var trainingRegression = require('./training/scales.json');
var request            = Promise.promisify(require('request'));

var makeScale = function(scale) {
    return function(call) {
        return call * trainingRegression[scale].b + trainingRegression[scale].a;
    };
};

var xScale = makeScale('geoXScale');
var yScale = makeScale('geoYScale');

var reqOptions = {
	t: 'css',
	rows: 100,
	page: 1
};

// Make a GET request to the front-facing interface to force a data refresh
// because the OSSI API provided by Sungard is absolutely retarded
request('http://p2c.tylerpolice.com/cad/callsnapshot.aspx')
	// Then make a POST request for the most recently closed calls using the required formData
	.then(function() {
		return request({url: 'http://p2c.tylerpolice.com/cad/cadHandler.ashx?op=s', form: reqOptions});
	})
	// Then transform the data provided into the fields we want, turning timestamps into UNIX time
	.then(function(response) {
		return JSON.parse(response[1]).rows.map(function(entry) {
            var lat = yScale(entry.geoY);
            var lng = xScale(entry.geoX);
			
			return {
				id: 	 	parseInt(entry.id),
				nature: 	entry.nature,
				address: 	entry.address,
				agency:	 	entry.agency,
				service: 	entry.service,
				timeOpen: 	(new Date(entry.starttime).getTime() / 1000),
				timeClose: 	(new Date(entry.closetime).getTime() / 1000),
				geoX: 	 	parseFloat(entry.geox),
				geoY: 	 	parseFloat(entry.geoy),
                lat: 		lat,
                lng: 		lng,
                location: 	r.point(lng, lat)
			};
		});
	})
	// Then make the connection to RethinkDB and insert the data using the CaseID from OSSI as the primary
	// ID. If the ID already exists in the document store, Rethink doesn't insert and gives us an error. We
	// ignore it because that's the behavior we wanted in the first place
	.then(function(data) {
		return r.connect(util.makeConnection()).then(function(connection) {
			return new Promise(function(resolve) {
				r.db('TylerSirens').table('calls').insert(data).run(connection, function() {
					resolve(connection);
				});
			});
		});
	})
	// Then close the Rethink connection, causing the application to close
	.then(function(connection) {
		connection.close();
	});
