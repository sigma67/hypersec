const { exec } = require('child_process');
const chai = require('chai');
const { Client } = require('pg');
const config = require('../app/explorerconfig.json');

const assert = chai.assert;

const client = new Client({
	user: config.postgreSQL.username,
	host: config.postgreSQL.host,
	database: config.postgreSQL.database,
	password: config.postgreSQL.passwd,
	port: config.postgreSQL.port
});

assert.isAbove(
	process.argv.length,
	2,
	'Please pass the chaincode name as a parameter after scan.js.'
);

// eslint-disable-next-line spellcheck/spell-checker
let cmd = 'revive -formatter unix';
if (process.argv[3]) {
	cmd += ' ' + process.argv[3];
}

exec(cmd, (error, stdout, stderr) => {
	if (error || stderr) {
		console.log(`Scan unsuccessful. error: ${error.message}, stderr: ${stderr}`);
	}
	client.connect();
	const query = `UPDATE chaincodes SET scan = '${stdout}' where name = '${process.argv[2]}'`;
	client.query(query, (err, res) => {
		assert.ifError(err);
		assert.strictEqual(res.rowCount, 1, 'UPDATE changed wrong number of rows.');
		client.end();
	});
});
