/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, {
	useState,
	useEffect,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles((theme) => ({
	root: {
	  width: '100%',
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
  }));

/* eslint-enable */

function Issues (getIssues, issues) {
	const classes = useStyles();
	const [expanded, setExpanded] = React.useState(false);

	const handleChange = (panel) => (event, isExpanded) => {
		setExpanded(isExpanded ? panel : false);
	};
	useEffect(() => {
		async function fetchData() { await getIssues(); }
		fetchData();
	});
	//let issues = [{id: 123, description: "abc"}, {id: 234, description: "def"}]
	
	return (
		<div>
			{ issues.map((entry, index) => (
				<Accordion expanded={expanded === 'panel' + index} onChange={handleChange('panel' + index)}>
					<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel1bh-content"
					id="panel1bh-header"
					>
					<Typography className={classes.heading}>{entry.id}</Typography>
					<Typography className={classes.secondaryHeading}>{entry.description}</Typography>
					</AccordionSummary>
					<AccordionDetails>
					<Typography>
						Nulla facilisi. Phasellus sollicitudin nulla et quam mattis feugiat. Aliquam eget
						maximus est, id dignissim quam.
					</Typography>
					</AccordionDetails>
				</Accordion>
			))
			}
		</div>
	);
};

export default Issues;