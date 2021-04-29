/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const Docker = require('dockerode');
const requtil = require('./requestutils');

/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
export async function logroutes(router, platform) {
	/**
	 * Docker Logs
	 * GET /logs
	 * curl -i 'http://<host>:<port>/logs/<container_id>'
	 * container_id can be the container hash or name (i.e. 860021eb649a, peer0.org1.example.com)
	 * Response:
	 * JSON (requires the container's logging format to be set to JSON)
	 * Fabric:
	 */
	router.get('/logs/:container_id', (req, res) => {
		const container_id = req.params.container_id;
		const docker = new Docker();
		const container = docker.getContainer(container_id);

		// const tail = req.query.tail ? req.query.tail : 50;
		const unixts = Math.floor(new Date() / 1000);
		const since = req.query.since ? unixts - req.query.since : unixts - 3600;

		let logs = [];
		let log;

		container.logs(
			{
				stdout: true,
				stderr: true,
				since: since
				// tail: tail
			},
			(err, result) => {
				if (err) {
					return requtil.invalidRequest(req, res);
				}
				logs = result
					.toString('utf8')
					.split('\u0001')
					.slice(1);
				for (let i = 0; i < logs.length; i++) {
					log = logs[i]
						.replace(/[^A-Za-z 0-9 .,?""!@#%^&*()-_=+;:<>/\\|}{[\]`~]*/g, '')
						.replace(/.+?(?={)/g, '');
					try {
						logs[i] = JSON.parse(log);
					} catch (e) {}
				}

				return res.send({
					status: 200,
					logs: logs
				});
			}
		);
	});

	/**
	 * can be expanded to include other READ endpoints, such as container.stats,
	 * or even start/stop containers
	 */
};