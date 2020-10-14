import React, { useEffect, useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { GridRows } from '@visx/grid';
import { max } from 'd3';
import { timeParse, timeFormat } from 'd3-time-format';



/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
	legend: {
		lineHeight: '0.9em',
		color: '#000',
		fontSize: '11px',
		float: 'right',
		marginLeft: '40px',
		cursor: 'pointer',
		height: '100%',
		display: 'flex'
	},
}));

/**
 * Global constants
 */
const margin = { top: 0, bottom: 40, left: 50, right: 30 };
const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(new Date(date).getTime()));

function TransactionSize({
	parentWidth,
	parentHeight,
	colorScale,
	data,
	from,
	to,
	avgTrxSize,
	displayedOrgs,
	onDisplayedOrgsChange
}) {
	const legendGlyphSize = 20;
	const classes = useStyles();
	const [width, setWidth] = useState(0);
	useEffect(() => {
		setWidth(parentWidth > 0 ? parentWidth - margin.left - margin.right : 0);
	}, [parentWidth]);

	const [height, setHeight] = useState(0);
	useEffect(() => {
		setHeight(parentHeight > 0 ? parentHeight - margin.top - margin.bottom : 0);
	}, [parentHeight]);

	const [yMax, setYMax] = useState(avgTrxSize);

	const timeScale = useMemo(
		() =>
			scaleTime({
				range: [0, width + margin.right],
				domain: [from, to]
			}),
		[width, from, to]
	);

	const countScale = useMemo(
		() =>
			scaleLinear({
				range: [height, 0],
				domain: [0, yMax],
				nice: true
			}),
		[height, yMax]
	);
	useEffect(() => {
		setYMax(
			data
				? max(data, d => d.size) >= avgTrxSize
					? max(data, d => d.size)
					: avgTrxSize
				: avgTrxSize
		);
	}, [data, avgTrxSize]);

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<Typography component='div'>
						<Box m={1}>
							Transaction Size [b]
						</Box>
					</Typography>
				</Grid>
				<Grid item xs={8}>
					<div className={classes.legend}>
						<LegendOrdinal scale={colorScale}>
							{labels => (
								<div style={{ display: 'flex', flexDirection: 'row' }}>
									{labels.map((label, i) => {
										if (label.datum === 'total') return <div key={`legend-organisation-${label.datum}`}/>
										return (
											<LegendItem
												key={`legend-organisation-${label.datum}`}
												margin="0 5px"
												onClick={() => {
													onDisplayedOrgsChange(label.datum);
												}}
											>
												<svg width={legendGlyphSize} height={legendGlyphSize}>
												<line
															stroke = {label.value}
															strokeWidth = { 3 }
															strokeDasharray = { displayedOrgs.indexOf(label.datum) > -1 ? '0' : '3, 3'	}
															x1={0}
															x2={legendGlyphSize}
															y1={legendGlyphSize / 2}
															y2={legendGlyphSize / 2}
														/>
												</svg>
												<LegendLabel
													align="left"
													margin="0 0 0 4px"
													onClick={() => {
														onDisplayedOrgsChange(label.datum);
													}}
												>
													{label.text}
												</LegendLabel>
											</LegendItem>
										)
									})}
								</div>
							)}
						</LegendOrdinal>
					</div>
				</Grid>
				<Grid item xs={12}>
					<svg width={parentWidth} height={parentHeight}>
						<g transform={`translate(${margin.left}, ${margin.top})`}>
							<GridRows
								scale={countScale}
								width={parentWidth}
								strokeDasharray="3,3"
								stroke="#919191"
								strokeOpacity={0.3}
								pointerEvents="none"
								numTicks={4}
							/>
		{/* 					<Grid
								xScale={timeScale}
								yScale={countScale}
								width={parentWidth}
								height={height}
								numTicksRows={4}
								numTicksColumns={width > 520 ? 8 : 5}
								strokeDasharray="3,3"
								stroke="#919191"
								strokeOpacity={0.3}
							/> */}
							<Group>
								{displayedOrgs.map(org => {
									const orgTrx = data.filter(trx => trx.creator_msp_id === org);
									orgTrx.sort((a, b) => {
										if (new Date(a.createdt) < new Date(b.createdt)) return -1;
										if (new Date(a.createdt) > new Date(b.createdt)) return 1;
										return 0;
									});
									return (
										<LinePath
											key = { `trxSize-${org}` }
											data = { orgTrx }
											x = { d => timeScale(new Date(d.createdt).getTime()) }
											y = { d => countScale(d.size) }
											strokeWidth = { 3 }
											curve = { curveMonotoneX }
											stroke = { colorScale(org) }
											shapeRendering = "geometricPrecision"
										/>
									)
								})}
							</Group>
							<AxisBottom
								scale={timeScale}
								top={height}
								numTicks={width > 520 ? 8 : 5}
								tickFormat={formatDate}
							/>
							<AxisLeft scale={countScale} numTicks={4} />
						</g>
					</svg>
				</Grid>
			</Grid>

		</React.Fragment>
	);
}

export default TransactionSize;
