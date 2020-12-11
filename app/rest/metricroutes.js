/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const util = require('util');
const request = require('request');
const requtil = require('./requestutils');

/* TODO load Prometheus host:port from config*/
const PROMETHEUS_API_URL = 'http://localhost:9090/api/v1/';

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

		request.get(
			{
				url: PROMETHEUS_API_URL + prometheus_query,
				qs: req.query
			},
			(err, response, body) => {
				if (err) {
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

	router.get('/charts/txprocessing', async (req, res) => {
		const get = util.promisify(request.get);
		const start = req.query.start;
		const response = await get({
			url: PROMETHEUS_API_URL + 'status/runtimeinfo'
		});
		const prometheusRuntimeInfo = JSON.parse(response.body).data;
		const prometheusStartTime = new Date(
			prometheusRuntimeInfo.startTime
		).getTime();
		req.query.start = start < prometheusStartTime ? start : prometheusStartTime;
		req.query.step = Math.ceil((req.query.end - start) / 1000).toString();
		let metrics = await Promise.all(
			[
				'sum(rate(endorser_proposal_duration_sum[5m]))/sum(rate(endorser_proposal_duration_count[5m]))',
				'rate(broadcast_enqueue_duration_sum{type="ENDORSER_TRANSACTION"}[5m])/rate(broadcast_enqueue_duration_count{type="ENDORSER_TRANSACTION"}[5m])',
				'rate(broadcast_validate_duration_sum{type="ENDORSER_TRANSACTION"}[5m])/rate(broadcast_validate_duration_count{type="ENDORSER_TRANSACTION"}[5m])'
			].map(q => {
				req.query.query = q;
				return get({
					url: PROMETHEUS_API_URL + 'query_range',
					qs: req.query
				});
			})
		);
		try {
			metrics = metrics.map(m => JSON.parse(m.body).data.result[0].values);
			const lengths = metrics.map(m => m.length);
			const minLength = Math.min(...lengths);
			if (minLength !== Math.max(...lengths)) {
				metrics = metrics.map(m => m.slice(m.length - minLength));
			}
			const processed = new Array(minLength);
			for (let i = 0; i < minLength; i++) {
				processed[i] = {
					time: metrics[0][i][0],
					endorser_proposal: metrics[0][i][1],
					broadcast_enqueue: metrics[1][i][1],
					broadcast_validate: metrics[2][i][1]
				};
			}
			res.json(processed);
		} catch (e) {
			res.json(e);
		}
	});
};

module.exports = metricroutes;
