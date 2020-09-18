/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const request = require('request');
const requtil = require('./requestutils');

/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
const metricroutes = async function(router, platform) {
	/**
	 * Prometheus Metrics
	 * GET /metrics
	 * curl -i 'http://<host>:<port>/metrics/<prometheus_query>'
	 * Response:
	 * JSON as specified in Prometheus docs
	 */
	router.get('/metrics/:prometheus_query', (req, res) => {
		const prometheus_query = req.params.prometheus_query;

		/* TODO load Prometheus host:port from config*/
		request.get(
			{
				url: 'http://localhost:9090/api/v1/' + prometheus_query,
				qs: req.query
			},
			(err, response, body) => {
				console.log(response);
				if (err) {
					console.log(err);
					return requtil.invalidRequest(req, res);
				}
				try {
					res.json(JSON.parse(body));
				} catch (e) {
					res.json({});
				}
			}
		);
	});
};

module.exports = metricroutes;
