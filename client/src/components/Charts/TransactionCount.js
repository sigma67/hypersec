import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { GridRows } from '@visx/grid';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { timeParse, timeFormat } from 'd3-time-format';
import moment from 'moment';



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

const defaultMargin = { top: 10, bottom: 40, left: 30, right: 0 };

const getDate = d => d.timestamp;
const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(date));

export default withTooltip(({
	width,
	height,
	margin = defaultMargin,
	colorScale,
	hoverColorScale,
	msPerBin,
	data,
	displayedOrgs,
	onDisplayedOrgsChange,
	showTooltip,
  hideTooltip,
	tooltipData,
	tooltipTop = 0,
  tooltipLeft = 0,
}) => {
	const legendGlyphSize = 15;
	const classes = useStyles();

	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

	const [maxTrxCount, setMaxTrxCount] = useState(0);
	useEffect(() => {
		let maxValue = 0;
		if (data.length < 1) return;
		data.forEach(bin => {
			maxValue = 	bin.total.length > maxValue ? bin.total.length : maxValue;
		});
		setMaxTrxCount(maxValue);
	}, [data]);

	const xScale = useMemo(
		() =>
			scaleBand({
				range: [0, xMax],
				domain: data.map(d => getDate(d)),
				padding: 0.1
			}),
		[xMax, data]
	);

	const yScale = useMemo(
		() =>
			scaleLinear({
				range: [yMax, 0],
				domain: [0, maxTrxCount],
				nice: true
			}),
		[yMax, maxTrxCount]
	);

	const [hoveredBar, setHoveredBar] = useState();
	const getColor = (key, index) => {
		if (hoveredBar) {
			return index===hoveredBar.index && key===hoveredBar.key ? hoverColorScale(key) : colorScale(key);
		} else {
			return colorScale(key);
		}
	}

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<Typography component='div'>
						<Box m={1}>
							Transactions Count
						</Box>
					</Typography>
				</Grid>
				<Grid item xs={8}>
					<div className={classes.legend}>
						<LegendOrdinal scale={colorScale}>
							{labels => (
								<div style={{ display: 'flex', flexDirection: 'row' }}>
									{labels.map((label, i) => (
										<LegendItem
											key={`legend-organisation-${label.datum}`}
											margin="0 5px"
											onClick={() => {
												onDisplayedOrgsChange(label.datum);
											}}
										>
											<svg width={legendGlyphSize} height={legendGlyphSize}>
												<rect
													key={`legend-organisation-${label.datum}`}
													x = { 0 }
													y = { 0 }
													height = {legendGlyphSize }
													width = { legendGlyphSize }
													strokeWidth = { 2 }
													stroke={ label.value }
													fill={ displayedOrgs.indexOf(label.datum) > -1 ? label.value : '#fff'	}
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
									))}
								</div>
							)}
						</LegendOrdinal>
					</div>
				</Grid>
				<Grid item xs={4}>
					<svg width={width} height={height}>
						<Group top={margin.top} left={margin.left}>
							<Group>
								<GridRows
									scale={yScale}
									width={xMax}
									strokeDasharray="3,3"
									stroke="#919191"
									strokeOpacity={0.3}
									pointerEvents="none"
									numTicks={8}
								/>
								<BarStack
									data = { data }
									keys = { displayedOrgs }
									value = {(d, k) => d[k].length}
									x = { getDate }
									xScale = { xScale }
									yScale = { yScale }
									color = {(d, k) => getColor(d, k)}
								>
									{barStacks =>
										barStacks.map(barStack =>
											barStack.bars.map(bar => {
												if (bar.key === 'total') return <div/>;
												return (
												<rect
													key={`bar-stack-${barStack.index}-${bar.index}`}
													x = { bar.x  }
													y = { bar.y }
													height = { bar.height }
													width = { bar.width }
													fill = { bar.color }
													stroke = '#fff'
													onMouseEnter={() => {
														setHoveredBar({index: bar.index, key: bar.key});
														showTooltip({
															tooltipLeft: bar.x + margin.left,
															tooltipTop: yScale(bar.bar[0]),
															tooltipData: {key: bar.key, data: bar.bar}
														})
													}}
													onMouseLeave={() => {
														setHoveredBar();
														hideTooltip();
													}}
												/>
											)})
										)
									}
								</BarStack>
							</Group>
							<AxisBottom
								scale={xScale}
								top={yMax}
								tickFormat={formatDate}
								tickLabelProps={() => ({
									fontSize: 11,
									textAnchor: 'middle',
								})}
		// 						numTicks={width > 1920 ? 5 : 10}
								numTicks={5}
							/>
							<AxisLeft scale={yScale} numTicks={4} />
						</Group>
					</svg>
					{tooltipData && (
						<div>
							<Tooltip
								top={tooltipTop + 14}
								left={tooltipLeft}
								style={{
									...defaultStyles,
									minWidth: 72,
									textAlign: 'center',
									transform: 'translateX(-50%)',
									fontSize: '11px'
								}}
							>
								<div>
										{
										`${moment(tooltipData.data['data']).format('MMM, Do')}, ${moment(tooltipData.data['data'].timestamp).hours()}:00 - ${moment(tooltipData.data['data'].timestamp + msPerBin).hours()}:00: `}
										<strong style={{fontWeight: 800}}>
											{tooltipData.data[1] - tooltipData.data[0]}
										</strong> trx
									</div>
							</Tooltip>
						</div>
					)}
				</Grid>
			</Grid>
		</React.Fragment>
	);
}
);
