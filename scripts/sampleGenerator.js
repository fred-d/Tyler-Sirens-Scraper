var r         = require('rethinkdb');
var path      = require('path');
var util      = require('./../src/util.js');
var Promise   = require('bluebird');
var request   = Promise.promisify(require('request'));
var writeFile = Promise.promisify(require('fs').writeFile);

var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + process.env.GOOGLE_API_KEY + '&address=';

r.connect(util.makeConnection())
	.then(function(connection) {
		return r.db('TylerSirens')
			.table('calls')
			.limit(1000)
			.run(connection)
			.then(function(response) {
				connection.close();
				return response.toArray();
			});
	})
	.then(function(data) {
		return Promise.all(data.map(function(call) {
			return request(geocodeUrl + call.address)
				.then(function(response) {
					return {
						input: {
							geoX: call.geoX,
							geoY: call.geoY
						},
						output: JSON.parse(response[1]).results[0].geometry.location
					};
				})
				.catch(function(err) {
					console.log('Unable to geocode based on partial address');
				});
		}));
	})
	.then(function(geocodedWithNull) {
		return geocodedWithNull.filter(function(geo) {
			return geo != undefined;
		});
	})
	.then(function(geocodedAddresses) {
		return writeFile(path.join(__dirname, './../training/trainingFile.json'), JSON.stringify(geocodedAddresses, null, 4));
	});
