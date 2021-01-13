import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleTime, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { AreaStack, Line } from '@visx/shape';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { GridRows, GridColumns } from '@visx/grid';

import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import {withTooltip,
	Tooltip,
	TooltipWithBounds,
	defaultStyles} from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { schemePastel1 } from 'd3-scale-chromatic';
import { max, bisector } from 'd3-array';
import { stack } from 'd3-shape';
import moment from 'moment';

/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
	legend: {
		lineHeight: '0.9em',
		color: '#000',
		fontSize: '11px',
		marginLeft: '50px',
		cursor: 'pointer',
		height: '100%',
		display: 'flex'
	}
}));

/**
 * Global constants
 */
const defaultMargin = { top: 10, bottom: 40, left: 50, right: 20 };
const keys = ['endorser_proposal', 'broadcast_enqueue', 'broadcast_validate'];
const legendGlyphSize = 15;

export default withTooltip(
	({
		width,
		height,
		margin = defaultMargin,
		data,
		from,
		to,
		showTooltip,
		hideTooltip,
		tooltipData,
		tooltipLeft = 0,
		customTimeAxisFormat
	}) => {
		const classes = useStyles();

		const xMax = width - margin.left - margin.right;
		const yMax = height - margin.top - margin.bottom;

		const [yMaxValue, setYMaxValue] = useState(0);

		const [displayedKeys, setDisplayedKeys] = useState(keys);

		const areaColorScale = useMemo(() => {
			return scaleOrdinal({
				range: schemePastel1,
				domain: keys
			});
		}, []);

		const xScale = useMemo(
			() => scaleTime({
				range: [0, xMax],
				domain: [from, to]
			}),
			[xMax, from, to]
		);

		const yScale = useMemo(
			() => scaleLinear({
				range: [yMax, 0],
				domain: [0, yMaxValue]
			}),
			[yMax, yMaxValue]
		);

		const handleDisplayedMetricsChange = useCallback(
			metric => {
				const tempKeys = [...displayedKeys];
				const index = tempKeys.indexOf(metric);
				index > -1
					? tempKeys.splice(index, 1)
					: tempKeys.splice(keys.indexOf(metric), 0, metric);
				setDisplayedKeys(tempKeys);
			},
			[displayedKeys]
		);

		const handleTooltip = useCallback(
			event => {
				const point = localPoint(event) || { x: 0, y: 0 };
				point.x -= margin.left;
				const x0 = xScale.invert(point.x);
				const bisectDate = bisector(d => new Date(d.time * 1000)).left;
				const index = bisectDate(data, x0, 1);
				const stacks = stack().keys(displayedKeys);
				const dataStacks = stacks(data);
				const tooltipCircles = [];
				keys.forEach(key => {
					const keyIndex = displayedKeys.indexOf(key);
					if (keyIndex > -1) {
						const d0 = dataStacks[keyIndex][index - 1];
						const d1 = dataStacks[keyIndex][index - 1];
						let d = d0;
						if (d1 && d1.time * 1000) {
							d =
								x0.valueOf() - d0.time * 1000 > d1.time * 1000 - x0.valueOf()
									? d1
									: d0;
						}
						tooltipCircles.push({
							key: key,
							value: (d.data[key] * 1000).toFixed(2),
							time: d.data.time * 1000,
							yValue: yScale(d[1] * 1000)
						});
					}
				});
				showTooltip({
					tooltipData: tooltipCircles,
					tooltipLeft: point.x
				});
			},
			[showTooltip, data, margin.left, xScale, yScale, displayedKeys]
		);

		useEffect(() => {
			data.forEach((d) => {
				d.endorser_proposal = isNaN(d.endorser_proposal) ? 0 : d.endorser_proposal;
				d.broadcast_enqueue = isNaN(d.broadcast_enqueue) ? 0 : d.broadcast_enqueue;
				d.broadcast_validate = isNaN(d.broadcast_validate) ? 0 : d.broadcast_validate;
			});
			setYMaxValue(data	? max(data,d => parseFloat(d.endorser_proposal) +	parseFloat(d.broadcast_enqueue) +	parseFloat(d.broadcast_validate)) * 1000	: 0);
		}, [data]);

		return (
			<React.Fragment>
				<Grid container>
					<Grid item xs={12}>
						<Typography component="div">
							<Box m={1}>Processing Time [ms]</Box>
						</Typography>
					</Grid>
					<Grid item xs={12}>
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
										numTicks={4}
									/>
									<GridColumns
										scale={xScale}
										height={yMax}
										strokeDasharray="3,3"
										stroke="#919191"
										strokeOpacity={0.3}
										pointerEvents="none"
										numTicks={width > 520 ? 8 : 5}
									/>
									<AreaStack
										top={defaultMargin.top}
										left={defaultMargin.left}
										keys={displayedKeys}
										data={data}
										x={d => xScale(d.data.time * 1000)}
										y0={d => yScale(d[0] * 1000) || 0}
										y1={d => yScale(d[1] * 1000) || 0}
										color={d => areaColorScale(d)}
										curve={curveLinear}
										onMouseMove={event => handleTooltip(event)}
										onMouseLeave={() => hideTooltip()}
									/>
								</Group>
								<AxisBottom
									scale={xScale}
									top={yMax}
									numTicks={width > 520 ? 8 : 5}
									tickFormat={customTimeAxisFormat}
								/>
								<AxisLeft scale={yScale} numTicks={4} />
								{tooltipData && (
									<Group>
										<Line
											from={{ x: tooltipLeft, y: 0 }}
											to={{ x: tooltipLeft, y: yMax }}
											stroke="#919191"
											strokeWidth={1}
											pointerEvents="none"
											strokeDasharray="5,2"
										/>
										{tooltipData.map(keyCircle => (
											<circle
												key={`tooltip-circle-${keyCircle.key}`}
												cx={tooltipLeft}
												cy={keyCircle.yValue}
												r={5}
												fill={areaColorScale(keyCircle.key)}
												stroke="white"
												strokeWidth={0.5}
												pointerEvents="none"
											/>
										))}
									</Group>
								)}
							</Group>
						</svg>
						{tooltipData && (
							<div>
								{tooltipData.map(keyCircle => (
									<TooltipWithBounds
										key={`tooltip-circle-${keyCircle.key}-tooltip`}
										top={keyCircle.yValue + 30}
										left={keyCircle.key === 'broadcast_enqueue' ? tooltipLeft - 25 : tooltipLeft + 47.5}
										style={{
											...defaultStyles,

											fontSize: '11px'
										}}
									>
										<strong style={{color: areaColorScale(keyCircle.key)}}>{`${keyCircle.value} ms`}</strong>
									</TooltipWithBounds>
								))}

								<Tooltip
									top={height}
									left={tooltipLeft + 40}
									style={{
										...defaultStyles,
										fontSize: '11px',
										minWidth: 72,
										textAlign: 'center',
										transform: 'translateX(-50%)'
									}}
								>
									<div>
										{moment(tooltipData[0].time).format('DD.MM., kk:mm:ss')}
									</div>
								</Tooltip>
							</div>
						)}
					</Grid>
					<Grid item xs={12}>
						<div className={classes.legend}>
							<LegendOrdinal scale={areaColorScale}>
								{labels => (
									<div style={{ display: 'flex', flexDirection: 'row' }}>
										{labels.map((label, i) => {
											return (
												<LegendItem
													key={`legend-metric-${label.datum}`}
													margin="0 5px"
													onClick={() => {
														handleDisplayedMetricsChange(label.datum);
													}}
												>
													<svg width={legendGlyphSize} height={legendGlyphSize}>
														<rect
															key={`legend-metric-${label.datum}`}
															x={0}
															y={0}
															height={legendGlyphSize}
															width={legendGlyphSize}
															strokeWidth={2}
															stroke={label.value}
															fill={
																displayedKeys.indexOf(label.datum) > -1
																	? label.value
																	: '#fff'
															}
														/>
													</svg>
													<LegendLabel
														align="left"
														margin="0 0 0 4px"
														onClick={() => {
															handleDisplayedMetricsChange(label.datum);
														}}
													>
														{label.text}
													</LegendLabel>
												</LegendItem>
											);
										})}
									</div>
								)}
							</LegendOrdinal>
						</div>
					</Grid>
				</Grid>
			</React.Fragment>
		);
	}
);
