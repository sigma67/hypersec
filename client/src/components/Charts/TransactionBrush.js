import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath, BarStack, AreaStack } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import { curveStepAfter, curveMonotoneX } from '@visx/curve';
import { GridRows } from '@visx/grid';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
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
const margin = { top: 5, bottom: 30, left: 30, right: 10 };
const PATTERN_ID = 'brush_pattern';
// const selectedBrushStyle = { fill: `url(#${PATTERN_ID})`, stroke: 'white' };
const selectedBrushStyle = { fill: '#919191', opacity: .5, stroke: 'white' }

const getDate = d => d.timestamp;
const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(date));

function TransactionBrush({
	parentWidth,
	parentHeight,
	colorScale,
	data,
	onBrushSelectionChange,
	displayedOrgs,
	onDisplayedOrgsChange
}) {
	const legendGlyphSize = 15;
	const classes = useStyles();
	const [width, setWidth] = useState(0);
	useEffect(() => {
		setWidth(parentWidth > 0 ? parentWidth - margin.left - margin.right : 0);
	}, [parentWidth]);

	const [height, setHeight] = useState(0);
	useEffect(() => {
		setHeight(parentHeight > 0 ? parentHeight - margin.top - margin.bottom : 0);
	}, [parentHeight]);

	const [maxTrxCount, setMaxTrxCount] = useState(0);
	const [total, setTotal] = useState([]);
	useEffect(() => {
		let maxValue = 0;
		const tempTotal = [];
		if (data.length < 1) return;
		data.forEach(bin => {
			tempTotal.push({timestamp: bin.timestamp, transactions: [...bin.total]});
			maxValue = 	bin.total.length > maxValue ? bin.total.length : maxValue;
		});
		setTotal(tempTotal);
		setMaxTrxCount(maxValue + maxValue * 0.01);
	}, [data]);

	const barStackScale = useMemo(
		() =>
			scaleBand({
				range: [0, width],
				domain: data.map(d => getDate(d)),
				// padding: 0.4
			}),
		[width, data]
	);

	const countScale = useMemo(
		() =>
			scaleLinear({
				range: [height, 0],
				domain: [0, maxTrxCount],
				nice: true
			}),
		[height, maxTrxCount]
	);

	const onBrushChange = domain => {
		if (!domain) return;
		onBrushSelectionChange(domain.xValues);
	};

	const getColor = d => colorScale(d);

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<Typography component='div'>
						<Box m={1}>
							Number of Transactions
						</Box>
					</Typography>
				</Grid>
				<Grid item xs={8}>
					<div className={classes.legend}>
						<LegendOrdinal scale={colorScale}>
							{labels => (
								<div style={{ display: 'flex', flexDirection: 'row' }}>
									{labels.map((label, i) => {
										if(label.datum === 'total') {
											return (
												<LegendItem
													key = {`brush-legend-total`}
													margin = "0 5px"
												>
													<svg width = { legendGlyphSize } height = { legendGlyphSize }>
														<line
															stroke = {label.value}
															strokeWidth = { 2 }
															strokeDasharray = {'5, 5'}
															x1={0}
															x2={legendGlyphSize}
															y1={legendGlyphSize / 2}
															y2={legendGlyphSize / 2}
														/>
													</svg>
													<LegendLabel
														align="left"
														margin="0 0 0 4px"
													>
														{label.text}
													</LegendLabel>
												</LegendItem>
											)
										}	else {
											return (
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
											)
										}
									})}
								</div>
							)}
						</LegendOrdinal>
					</div>
				</Grid>
				<Grid item xs={4}>
			<svg width={parentWidth} height={parentHeight}>
				<g transform={`translate(${margin.left}, ${margin.top})`}>
					<GridRows
            scale={countScale}
            width={width}
            strokeDasharray="3,3"
            stroke="#919191"
            strokeOpacity={0.3}
						pointerEvents="none"
						numTicks={8}
          />
					<Group>
					<AreaStack
						data = { data }
						keys = { displayedOrgs }
						value = {(d, k) => d[k].length}
						x={ d => barStackScale(d.data.timestamp) + barStackScale.bandwidth() / 2 }
						y0={d => countScale(d[0])}
						y1={d => countScale(d[1])}
						color = { getColor }
						curve={ curveStepAfter }
					/>
{/* 						<BarStack
							data = { data }
							keys = { displayedOrgs }
							value = {(d, k) => d[k].length}
							x = { getDate }
							xScale = { barStackScale }
							yScale = { countScale }
							color = { getColor }
						>
							{barStacks =>
								barStacks.map(barStack =>
									barStack.bars.map(bar => {
										if (bar.key === 'total') return <div/>;
										return (
										<rect
											key={`bar-stack-${barStack.index}-${bar.index}`}
											x = { bar.x + barStackScale.bandwidth() / 2 }
											y = { bar.y }
											height = { bar.height }
											width = { bar.width }
											fill = { bar.color }
										/>
									)})
								)
							}
						</BarStack> */}
					</Group>
					<Group>
						<LinePath
							curve = { curveStepAfter }
							data = { total }
							x = { d => barStackScale(d.timestamp) + barStackScale.bandwidth() / 2 }
							y = { d => countScale(d.transactions.length) }
							stroke={colorScale('total')}
							strokeWidth = {2}
							strokeDasharray = {'9, 5'}
							shapeRendering="geometricPrecision"
						/>
					</Group>
					<Group>
						<PatternLines
							id={PATTERN_ID}
							height={8}
							width={8}
							stroke={'#58c5c2'}
							strokeWidth={1}
							orientation={['diagonal']}
						/>
						<Brush
							xScale={barStackScale}
							yScale={countScale}
							width={width}
							height={height}
							handleSize={8}
							resizeTriggerAreas={['left', 'right']}
							brushDirection="horizontal"
							onChange={onBrushChange}
							onClick={() => onBrushSelectionChange([])}
							selectedBoxStyle={selectedBrushStyle}
						/>
					</Group>
					<AxisBottom
						scale={barStackScale}
						top={height}
						tickFormat={formatDate}
						tickLabelProps={() => ({
							fontSize: 11,
							textAnchor: 'middle',
						})}
						numTicks={width > 1920 ? 20 : 10}
					/>
					<AxisLeft scale={countScale} numTicks={4} />
				</g>
			</svg>
			</Grid>
			</Grid>
		</React.Fragment>
	);
}

export default TransactionBrush;
