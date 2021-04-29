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
export async function metricroutes(router, platform) {
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


	/**
	 * Metrics for transaction charts
	 * GET /metrics
	 * 
	 * Response:
	 * Array of JSONs with time points and corresponding metrics
	 */
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

	/**
	 * Metrics for peer chart
	 * GET /metrics
	 * 
	 * Response:
	 * Array of JSONs with time points and corresponding metrics
	 */
	router.get('/charts/peers', async (req, res) => {
		const get = util.promisify(request.get);
		const current = req.query.current;
		const reference = req.query.reference;
		if(!(current && reference)){
			return requtil.invalidRequest(req, res);
		}
		const queries_targets = [
			"peer",
			"orderer",
			"peer"
		];
		const queries_raw = [
			'rate(gossip_comm_messages_received[%TIME%])',
			'rate(grpc_server_stream_messages_sent{service="protos_Deliver", method="Deliver"}[%TIME%])',
			'rate(grpc_server_stream_messages_sent{service="orderer_AtomicBroadcast", method="Deliver"}[%TIME%])'
		]
		let queries = [];
		for(const q of queries_raw){
			queries.push(q.replace(/%TIME%/g, current))
			queries.push(q.replace(/%TIME%/g, reference))
		}
		
		let metrics = await Promise.all(
			queries.map(q => {
				return get({
					url: PROMETHEUS_API_URL + 'query',
					qs: {query: q}
				});
			})
		);

		try {
			metrics = metrics.map(
				m => JSON.parse(m.body).data.result[0]
			)
			let processed = Array(queries_raw.length);
			for(let i = 0; i < queries_raw.length; i++){
				let j = i * 2;
				let current = parseFloat(metrics[j].value[1])
				let reference = parseFloat(metrics[j+1].value[1])
				processed[i] = {
					source: metrics[j].metric.instance,
					target: queries_targets[i],
					current: current,
					reference: reference,
					deviation: current / reference
				}
			}
			res.json(processed);
		} catch (e) {
			res.json(e);
		}
	})
}