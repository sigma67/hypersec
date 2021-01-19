import React, { useMemo, useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Circle, Line} from '@visx/shape';
import { Group } from '@visx/group';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { GridRows, GridColumns } from '@visx/grid';
import {defaultStyles, Tooltip, TooltipWithBounds, withTooltip} from '@visx/tooltip';
import { max } from 'd3';
import moment from 'moment';
import { localPoint } from '@visx/event';

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

export default withTooltip(
	({
		width,
		height,
		margin = defaultMargin,
		colorScale,
		data,
		from,
		to,
		msPerBin,
		showTooltip,
		hideTooltip,
		tooltipData,
		tooltipLeft = 0,
		tooltipTop = 0,
		avgTrxSize,
		displayedOrgs,
		onDisplayedOrgsChange,
		customTimeAxisFormat
	}) => {
		const legendGlyphSize = 20;
		const classes = useStyles();
		const xMax = width - margin.left - margin.right;
		const yMax = height - margin.top - margin.bottom;
		const [hoveredCircle, setHoveredCircle] = useState();

		const yMaxValue = useMemo(() => {
			return data
				? max(data, d => d.totalSize / d.totalCount) >= avgTrxSize
					? max(data, d => d.totalSize / d.totalCount)
					: avgTrxSize
				: avgTrxSize;
		}, [data, avgTrxSize]);

		const xScale = useMemo(
			() =>
				scaleTime({
					range: [0, xMax],
					domain: [from, to]
				}),
			[xMax, from, to]
		);

		const yScale = useMemo(
			() =>
				scaleLinear({
					range: [yMax, 0],
					domain: [0, yMaxValue],
					nice: true
				}),
			[yMax, yMaxValue]
		);


		const getOpacity = (timestamp, org) => {
			if (hoveredCircle) {
				return (hoveredCircle.timestamp === timestamp && hoveredCircle.org === org) ? 1 : 0.7;
			} else {
				return 0.7;
			}
		};

		return (
			<React.Fragment>
				<Grid container>
					<Grid item xs={12}>
						<Typography component="div">
							<Box m={1}>Transaction Size [b]</Box>
						</Typography>
					</Grid>
					<Grid item xs={12}>
						<svg width={width} height={height}>
							<Group top={margin.top} left={margin.left}>
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
									numTicks={yMax > 520 ? 8 : 5}
								/>
								{tooltipData && (
									<Group>
										<Line
											from={{ x: xScale(tooltipData.time), y: yScale(tooltipData.size / tooltipData.count) }}
											to={{ x: xScale(tooltipData.time), y: yMax }}
											stroke="#919191"
											strokeWidth={1}
											pointerEvents="none"
											strokeDasharray="5,2"
										/>
									</Group>
								)}
								{
									data.map((bin) =>
										displayedOrgs.map(org => {
											if (!bin[org]) return <div/>;
											return (
												<Circle
													key={`point-${bin.timestamp}-${org}`}
													cx={xScale(bin.timestamp)}
													cy={yScale(bin[org].size / bin[org].count)}
													fill={colorScale(org)}
													opacity={getOpacity(bin.timestamp, org)}
													r={bin[org].count < 15 ? bin[org].count : 15}
													onMouseMove={event => {
														const point = localPoint(event) || { x: 0, y: 0 };
														setHoveredCircle({timestamp: bin.timestamp, org: org});
														showTooltip({
															tooltipData: {
																time: bin.timestamp,
																org: org,
																size: bin[org].size,
																count: bin[org].count
															},
															tooltipLeft: point.x,
															tooltipTop: point.y
														})
													}}
													onMouseLeave={() => { hideTooltip(); setHoveredCircle(); } }
												/>
											)
										})
									)
								}
								<AxisBottom
									scale={xScale}
									top={yMax}
									numTicks={xMax > 520 ? 8 : 5}
									tickFormat={customTimeAxisFormat}	/>
								<AxisLeft scale={yScale} numTicks={4} />
							</Group>
						</svg>
						{tooltipData && (
							<div>
									<TooltipWithBounds
										key={`tooltip-${tooltipData.timestamp}-${tooltipData.org}`}
										top={tooltipTop}
										left={tooltipLeft}
										style={{...defaultStyles,	fontSize: '11px'}} >
										<div>
											{`${tooltipData.org}: `}
											<strong style={{color: colorScale(tooltipData.org)}}>{`${Math.floor(tooltipData.size / tooltipData.count)} bytes (${tooltipData.count} Tx)`}</strong>
										</div>
									</TooltipWithBounds>

								<Tooltip
									top={height}
									left={tooltipLeft}
									style={{
										...defaultStyles,
										fontSize: '11px',
										minWidth: 72,
										textAlign: 'center',
										transform: 'translateX(-50%)'
									}}
								>
									<strong>
										{`${moment(tooltipData.time).format('DD.MM., kk:mm')} - ${moment(tooltipData.time + msPerBin).format('kk:mm')}`}
									</strong>
								</Tooltip>
							</div>
						)}
					</Grid>
					<Grid item xs={12}>
						<div className={classes.legend}>
							<LegendOrdinal scale={colorScale}>
								{labels => (
									<div style={{ display: 'flex', flexDirection: 'row' }}>
										{labels.map((label, i) => {
											if (label.datum === 'total')
												return (
													<div key={`legend-organisation-${label.datum}`} />
												);
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
															stroke={label.value}
															strokeWidth={3}
															strokeDasharray={
																displayedOrgs.indexOf(label.datum) > -1
																	? '0'
																	: '3, 3'
															}
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
