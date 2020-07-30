/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Row, Col } from 'reactstrap';
import { Button, List, Icon } from 'semantic-ui-react';
//import FontAwesome from 'react-fontawesome';
import Card from '@material-ui/core/Card';
//import Icon from '@material-ui/icons';
import BlockChart from '../Charts/BlockChart';
import PeersHealth from '../Lists/PeersHealth';
//import TimelineStream from '../Lists/TimelineStream';
//import BlockList from '../Lists/BlockList';
import TransactionChart from '../Charts/TransactionChart';
//import SumUpButtons from '../Forms/SumUpButtons';
import Map from '../Charts/Map';

import { blockListType, peerStatusType } from '../types';

/* istanbul ignore next */
const styles = theme => {
	const { type } = theme.palette;
	const dark = type === 'dark';
	return {
		background: {
			backgroundColor: dark ? 'rgb(36, 32, 54)' : '#f0f5f9'
		},
		view: {
			paddingTop: 85,
			paddingLeft: 0,
			width: '80%',
			marginLeft: '10%',
			marginRight: '10%'
		},
		blocks: {
			height: 175,
			marginBottom: 20,
			backgroundColor: dark ? '#453e68' : '#ffffff',
			boxShadow: dark ? '1px 2px 2px rgb(215, 247, 247)' : undefined
		},
		count: {
			marginTop: '55%',
			color: dark ? '#ffffff' : undefined
		},
		statistic: {
			display: 'block',
			float: 'left',
			height: '100%',
			width: '25%',
			textAlign: 'center',
			fontSize: '18pt',
			color: dark ? '#ffffff' : '#000000'
		},
		vdivide: {
			'&::after': {
				borderRight: `2px ${dark ? 'rgb(40, 36, 61)' : '#dff1fe'} solid`,
				display: 'block',
				height: '45%',
				bottom: '55%',
				content: "' '",
				position: 'relative'
			}
		},
		icon: {
			justifyContent: 'center',
			marginLeft: '60%',
			marginTop: '65%',
			width: '50px',
			height: '10px'
		},
		node: {
			color: dark ? '#183a37' : '#21295c',
			backgroundColor: dark ? 'rgb(104, 247, 235)' : '#858aa6'
		},
		block: {
			color: dark ? '#1f1a33' : '#004d6b',
			backgroundColor: dark ? 'rgb(106, 156, 248)' : '#b9d6e1'
		},
		chaincode: {
			color: dark ? 'rgb(121, 83, 109)' : '#407b20',
			backgroundColor: dark ? 'rgb(247, 205, 234)' : '#d0ecda'
		},
		transaction: {
			color: dark ? 'rgb(216, 142, 4)' : '#ffa686',
			backgroundColor: dark ? 'rgb(252, 224, 174)' : '#ffeed8'
		},
		section: {
			height: 335,
			marginBottom: '2%',
			color: dark ? '#ffffff' : undefined,
			backgroundColor: dark ? '#3c3558' : undefined
		},
		center: {
			textAlign: 'center'
		}
	};
};

export class SecurityView extends Component {
	render() {
		const { peerStatus } = this.props;

		const { classes } = this.props;
		return (
			<div className={classes.background}>
				<div className={classes.view}>
					<Row>
						<Card>
							<Col sm="9">
								<Row>
									<List horizontal>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
										<List.Item>
											<Icon name="cube" size="huge" />
										</List.Item>
									</List>
								</Row>
							</Col>
						</Card>
						<Card>
							<Col sm="3">
								<Row>
									<Button.Group vertical>
										<Button basic color="blue">
											Blocks
										</Button>
										<Button basic color="blue">
											Transactions
										</Button>
									</Button.Group>
								</Row>
							</Col>
						</Card>
					</Row>
					<Row>
						<Col sm="6">
							<Row>
								<h4>Network</h4>
							</Row>
							<Row>
								<Card className={classes.section}>
									<PeersHealth peerStatus={peerStatus} />
								</Card>
							</Row>
							<Row>
								<Card>
									<Map />
								</Card>
							</Row>
							<Row>
								<Card>
									<h4>Map</h4>
								</Card>
							</Row>
						</Col>
						<Col sm="6">
							<Row>
								<h4>Blockchain Progress</h4>
							</Row>
							<Row>
								<Card className={classes.section}>
									<BlockChart />
								</Card>
							</Row>
							<h4>Transaction Log</h4>
							<Card className={classes.section}>
								<TransactionChart />
							</Card>
						</Col>
					</Row>
				</div>
			</div>
		);
	}
}

SecurityView.propTypes = {
	blockList: blockListType.isRequired,
	peerStatus: peerStatusType.isRequired
};

export default withStyles(styles)(SecurityView);
