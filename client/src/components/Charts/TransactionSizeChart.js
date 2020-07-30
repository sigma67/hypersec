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
import TimeChart from './TimeChart';
import {
	currentChannelType,
	getTransactionSizeType,
	transactionSizeType
} from '../types';

const { currentChannelSelector, transactionSizeSelector } = chartSelectors;

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

export class TransactionSizeChart extends Component {
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
		const { getTransactionSize } = this.props;

		getTransactionSize(currentChannel);
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
		const { transactionSize, classes } = this.props;

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
							TRANSACTION SIZE
						</NavLink>
					</NavItem>
				</Nav>
				<TabContent activeTab={activeTab}>
					<TabPane tabId="1">
						<TimeChart chartData={this.timeDataSetup(transactionSize)} />
					</TabPane>
				</TabContent>
			</div>
		);
	}
}

TransactionSizeChart.propTypes = {
	currentChannel: currentChannelType.isRequired,
	getTransactionSize: getTransactionSizeType.isRequired,
	transactionSize: transactionSizeType.isRequired
};

export default compose(
	withStyles(styles),
	connect(
		state => ({
			transactionSize: transactionSizeSelector(state),
			currentChannel: currentChannelSelector(state)
		}),
		{
			getTransactionSize: chartOperations.transactionSize
		}
	)
)(TransactionSizeChart);
