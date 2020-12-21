/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const request = require('request');
const requtil = require('./requestutils');
const config = require('../explorerconfig.json')

/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
const externalroutes = async function(router, platform) {
	/**
	 * Hyperledger Fabric JIRA issues
	 */
	router.get('/issues', async (req, res) => {
		const user = config.jira.username;
		const pass = config.jira.password;
		request.
			get({
				url: `https://${user}:${pass}@jira.hyperledger.org/rest/api/2/search`,
				qs: {
					jql: 'project = FAB AND issuetype = Bug AND priority in (Highest, High) '
						 + 'AND status in ("In Progress",Closed,"To Do",Returned,"In CR Review") '
						 + 'ORDER BY updated DESC',
					fields: 'summary,description,priority,reporter,created,updated'
				}
			}, (err, response, body) => {
				if (err) {
					return requtil.invalidRequest(req, res);
				}
				try {
					res.json(JSON.parse(body));
				} catch (e) {
					console.log(e)
				}
			});
	});

};

module.exports = externalroutes;
