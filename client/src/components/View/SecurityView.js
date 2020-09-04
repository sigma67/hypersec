import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Row, Col } from 'reactstrap';
import { Card, CardHeader, CardContent } from '@material-ui/core';

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
		console.log(classes);
		return (
			<div className={classes.background}>
				<div className={classes.view}>
					<Row>
						<Col sm="6">
							<Card className={`${classes.section}`} variant="outlined">
								<CardHeader title="Network" subheader="Peers Health"></CardHeader>
								<CardContent>PeersHealthComponent</CardContent>
							</Card>
						</Col>
						<Col sm="6">
							<Card className={`${classes.section}`} variant="outlined">
								<CardHeader
									title="Blockchain Progress"
									subheader="Subheader"
								></CardHeader>
								<CardContent>BlockChart</CardContent>
							</Card>
						</Col>
					</Row>
					<Row>
						<Col sm="6">
							<Card className={`${classes.section}`} variant="outlined">
								<CardHeader title="Map" subheader=""></CardHeader>
								<CardContent>MapChart</CardContent>
							</Card>
						</Col>
						<Col sm="6">
							<Card className={`${classes.section}`} variant="outlined">
								<CardHeader title="Transaction Log" subheader="Subheader"></CardHeader>
								<CardContent>TransactionChart</CardContent>
							</Card>
						</Col>
					</Row>
				</div>
			</div>
		);
	}
}

SecurityView.propTypes = {};

export default withStyles(styles)(SecurityView);
