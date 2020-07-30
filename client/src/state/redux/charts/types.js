/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const namespaces = 'charts';
/* Analytics Charts */
const BLOCK_CHART_MIN = `${namespaces}/BLOCK_CHART_MIN`;
const BLOCK_CHART_HOUR = `${namespaces}/BLOCK_CHART_HOUR`;
const TRANSACTION_CHART_MIN = `${namespaces}/TRANSACTION_CHART_MIN`;
const TRANSACTION_CHART_HOUR = `${namespaces}/TRANSACTION_CHART_HOUR`;

const TRANSACTION_CHART_SIZE = `${namespaces}/TRANSACTION_CHART_SIZE`;
const INTERBLOCK_TIME_CHART = `${namespaces}/INTERBLOCK_TIME_CHART`;

/* Pie Graph */
const TRANSACTION_CHART_ORG = `${namespaces}/TRANSACTION_CHART_ORG`;

/* Notification */
const NOTIFICATION_LOAD = `${namespaces}/NOTIFICATION_LOAD`;

/* Dash Stats */
const DASHBOARD_STATS = `${namespaces}/DASHBOARD_STATS`;

/* Channel  */
const CHANNEL = `${namespaces}/CHANNEL`;
const CHANGE_CHANNEL = `${namespaces}/CHANGE_CHANNEL`;
const CHANNEL_LIST = `${namespaces}/CHANNEL_LIST`;

const PEER_STATUS = `${namespaces}/PEER_STATUS`;

const ERROR_MESSAGE = 'ERROR_MESSAGE';

const BLOCK_ACTIVITY = `${namespaces}/BLOCK_ACTIVITY`;

export default {
	BLOCK_CHART_HOUR,
	BLOCK_CHART_MIN,
	INTERBLOCK_TIME_CHART,
	CHANGE_CHANNEL,
	CHANNEL,
	CHANNEL_LIST,
	DASHBOARD_STATS,
	NOTIFICATION_LOAD,
	PEER_STATUS,
	TRANSACTION_CHART_HOUR,
	TRANSACTION_CHART_MIN,
	TRANSACTION_CHART_ORG,
	TRANSACTION_CHART_SIZE,
	ERROR_MESSAGE,
	BLOCK_ACTIVITY
};
