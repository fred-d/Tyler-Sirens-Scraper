var r    = require('rethinkdb');
var util = require('./../src/util.js');

function dbUp(connection) {
	return r.dbCreate('TylerSirens');
}

function tableUp(connection) {
	return r.db('TylerSirens')
		.tableCreate('calls')
}

r.connect(util.makeConnection())
	.then(util.migrate(dbUp))
	.then(util.migrate(tableUp))
	.then(util.invoke('close'));