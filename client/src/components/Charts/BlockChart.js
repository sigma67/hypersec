/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import compose from 'recompose/compose';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import moment from 'moment-timezone';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';
import { chartSelectors, chartOperations } from '../../state/redux/charts';
import TimeChart2 from './TimeChart2';
import {
	blockPerHourType,
	blockPerMinType,
	currentChannelType,
	interblockTimeType,
	getBlocksPerHourType,
	getBlocksPerMinType,
	getInterblockTimeType
} from '../types';

const {
	blockPerHourSelector,
	blockPerMinSelector,
	currentChannelSelector,
	interblockTimeSelector
} = chartSelectors;

/* istanbul ignore next */
const styles = theme => {
	const { type } = theme.palette;
	const dark = type === 'dark';
	return {
		chart: {
			color: dark ? '#ffffff' : undefined,
			backgroundColor: dark ? '#453e68' : undefined
		}
	};
};

export class BlockChart extends Component {
	constructor(props) {
		super(props);
		this.state = {
			activeTab: '1'
		};
	}

	componentDidMount() {
		this.interVal = setInterval(() => {
			const { currentChannel } = this.props;
			this.syncData(currentChannel);
		}, 60000);
	}

	componentWillUnmount() {
		clearInterval(this.interVal);
	}

	syncData = currentChannel => {
		const { getBlocksPerHour, getBlocksPerMin, getInterblockTime } = this.props;

		getBlocksPerMin(currentChannel);
		getBlocksPerHour(currentChannel);
		getInterblockTime(currentChannel);
	};

	timeDataSetup = (chartData = []) => {
		let dataMax = 0;
		const displayData = chartData.map(data => {
			if (parseInt(data.count, 10) > dataMax) {
				dataMax = parseInt(data.count, 10);
			}

			return {
				datetime: moment(data.datetime)
					.tz(moment.tz.guess())
					.format('h:mm A'),
				count: data.count
			};
		});

		dataMax += 5;

		return {
			displayData,
			dataMax
		};
	};

	toggle = tab => {
		this.setState({
			activeTab: tab
		});
	};

	render() {
		const { activeTab } = this.state;
		const { blockPerHour, blockPerMin, interblockTime, classes } = this.props;

		return (
			<div className={classes.chart}>
				<Nav tabs>
					<NavItem>
						<NavLink
							className={classnames({
								active: activeTab === '1'
							})}
							onClick={() => {
								this.toggle('1');
							}}
						>
							BLOCKS / HOUR
						</NavLink>
					</NavItem>
					<NavItem>
						<NavLink
							className={classnames({
								active: activeTab === '2'
							})}
							onClick={() => {
								this.toggle('2');
							}}
						>
							BLOCKS / MIN
						</NavLink>
					</NavItem>
					<NavItem>
						<NavLink
							className={classnames({
								active: activeTab === '3'
							})}
							onClick={() => {
								this.toggle('3');
							}}
						>
							INTER-BLOCK TIME (min)
						</NavLink>
					</NavItem>
				</Nav>
				<TabContent activeTab={activeTab}>
					<TabPane tabId="1">
						<TimeChart2 chartData={this.timeDataSetup(blockPerHour)} />
					</TabPane>
					<TabPane tabId="2">
						<TimeChart2 chartData={this.timeDataSetup(blockPerMin)} />
					</TabPane>
					<TabPane tabId="3">
						<TimeChart2 chartData={this.timeDataSetup(interblockTime)} />
					</TabPane>
				</TabContent>
			</div>
		);
	}
}

BlockChart.propTypes = {
	blockPerHour: blockPerHourType.isRequired,
	blockPerMin: blockPerMinType.isRequired,
	currentChannel: currentChannelType.isRequired,
	interblockTime: interblockTimeType.isRequired,
	getBlocksPerHour: getBlocksPerHourType.isRequired,
	getBlocksPerMin: getBlocksPerMinType.isRequired,
	getInterblockTime: getInterblockTimeType.isRequired
};

export default compose(
	withStyles(styles),
	connect(
		state => ({
			blockPerHour: blockPerHourSelector(state),
			blockPerMin: blockPerMinSelector(state),
			interblockTime: interblockTimeSelector(state),
			currentChannel: currentChannelSelector(state)
		}),
		{
			getBlocksPerHour: chartOperations.blockPerHour,
			getBlocksPerMin: chartOperations.blockPerMin,
			getInterblockTime: chartOperations.interblockTime
		}
	)
)(BlockChart);
