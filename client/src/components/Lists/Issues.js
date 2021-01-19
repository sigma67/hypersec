/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, {
	useEffect,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import { getIssuesType } from '../types';
import Grid from "@material-ui/core/Grid";

const useStyles = makeStyles((theme) => ({
	root: {
	  width: '100%',
	},
	grid: {
		flexGrow: 1,
	},
	heading: {
	  fontSize: theme.typography.pxToRem(15),
	  flexBasis: '33.33%',
	  flexShrink: 0,
	},
	secondaryHeading: {
	  fontSize: theme.typography.pxToRem(15),
	  color: theme.palette.text.secondary,
	},
	scrollable: {
		height: 300,
		overflowY: 'scroll'
	},
	priority: {
		width: '1.5rem',
		transform: 'none !important'
	},
}));

/* eslint-enable */

const Issues = ({getIssues, issues}) => {
	const classes = useStyles();
	const [expanded, setExpanded] = React.useState(false);

	const handleChange = (panel) => (event, isExpanded) => {
		setExpanded(isExpanded ? panel : false);
	};
	useEffect(() => {
		async function fetchData() {
			await getIssues();
	 }
		issues = [];
		fetchData();
	}, []);

	if(issues) {
		return (
			<div>
				<React.Fragment>
				<div className={classes.scrollable}>
				{issues.map((entry, index) => (
					<Accordion expanded={expanded === 'panel' + index} onChange={handleChange('panel' + index)}>
						<AccordionSummary
							expandIcon={<img className={classes.priority} src={entry.fields.priority.iconUrl}/>}
							aria-controls="panel1bh-content"
							id="panel1bh-header"
						>
							<Typography className={classes.heading}>{entry.key}</Typography>
							<Typography className={classes.secondaryHeading}>{entry.fields.summary}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<div className={classes.grid}>
								<a href={"https://jira.hyperledger.org/browse/" + entry.key} target='_blank'>Link: {entry.key}</a>
							<Grid container spacing={3}>
								<Grid item xs>
									<Typography variant="caption">
										<p>Created: {new Date(entry.fields.created).toLocaleString()} by {entry.fields.reporter.displayName}</p>
									</Typography>
								</Grid>
								<Grid item xs={1}>
								</Grid>
								<Grid item xs>
									<Typography variant="caption" align="right">
										<p>Updated: {new Date(entry.fields.updated).toLocaleString()}</p>
									</Typography>
								</Grid>
							</Grid>
								<Grid container spacing={3}>
								<Grid item>
															<Typography variant="body2">
																{entry.fields.description}
															</Typography>
								</Grid>
							</Grid>
							</div>
						</AccordionDetails>
					</Accordion>
				))
				}
				</div>
				</React.Fragment>
			</div>
		);
	}
	else{
		return (<div></div>)
	}
};

Issues.propTypes = {
	getIssues: getIssuesType
}

export default Issues;
