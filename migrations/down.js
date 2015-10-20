var r    = require('rethinkdb');
var util = require('./../src/util.js');

function dbDown(connection) {
	return r.dbDrop('TylerSirens');
}

r.connect(util.makeConnection())
	.then(util.migrate(dbDown))
	.then(util.invoke('close'));