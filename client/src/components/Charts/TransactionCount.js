import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleLinear, scaleBand, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import {Bar, BarStack, Line} from '@visx/shape';
import { Group } from '@visx/group';
import { GridRows } from '@visx/grid';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import {withTooltip, Tooltip, defaultStyles, TooltipWithBounds} from '@visx/tooltip';
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

const defaultMargin = { top: 10, bottom: 40, left: 50, right: 20 };

const getDate = d => d.timestamp;

export default withTooltip(
	({
		width,
		height,
		margin = defaultMargin,
		colorScale,
		msPerBin,
		data,
		from,
		to,
		displayedOrgs,
		onDisplayedOrgsChange,
		showTooltip,
		hideTooltip,
		tooltipData,
		tooltipTop = 0,
		tooltipLeft = 0,
		customTimeAxisFormat
	}) => {
		const legendGlyphSize = 15;
		const classes = useStyles();

		const xMax = width - margin.left - margin.right;
		const yMax = height - margin.top - margin.bottom;

		const [maxTrxCount, setMaxTrxCount] = useState(0);

		useEffect(() => {
			let maxValue = 0;
			if (data.length < 1) return;
			data.forEach((bin, index) => {
				maxValue = bin.total.length > maxValue ? bin.total.length : maxValue;
			});
			setMaxTrxCount(maxValue);
		}, [data]);

		const xBandScale = useMemo(
			() =>
				scaleBand({
					range: [0, xMax],
					domain: data.map(d => getDate(d)),
					// padding: 0.1
				}),
			[xMax, data]
		);

		const xTimeScale = useMemo(
			() =>
				scaleTime({
					range: [0, xMax],
					domain: [from, to]
				}),
			[xMax, from, to]
		)

		const yScale = useMemo(
			() =>
				scaleLinear({
					range: [yMax, 0],
					domain: [0, maxTrxCount],
					nice: true
				}),
			[yMax, maxTrxCount]
		);

		const [hoveredBarStack, setHoveredBarStack] = useState();
		const getOpacity = (key, index) => {
			if (hoveredBarStack) {
				return index === hoveredBarStack.index	? 1 : 0.7;
			} else {
				return 0.7;
			}
		};

		const handleTooltip = useCallback(
			event => {
				const point = localPoint(event) || {
					x: 0,
					y: 0
				};
				const tempIndex = Math.floor((point.x - margin.left) / xBandScale.step());
				const index = Math.max(0, Math.min(tempIndex, xBandScale.domain().length-1));
				const binTimestamp = xBandScale.domain()[index];
				const bin = data.filter(d => d.timestamp === binTimestamp)[0];

				setHoveredBarStack({
					index: index,
				});

				const orgCounts = [];
				displayedOrgs.forEach(org => {
					if (org === 'total') return;
					orgCounts.push({key: org, value: bin[org].length});
				});

				showTooltip({
					tooltipData: {time: binTimestamp, orgCounts: orgCounts},
					tooltipLeft: xBandScale(binTimestamp) + xBandScale.bandwidth() / 2
				})

			}, [showTooltip, setHoveredBarStack, data, displayedOrgs, margin.left, margin.right, xBandScale, yScale]
		);

		return (
			<React.Fragment>
				<Grid container>
					<Grid item xs={12}>
						<Typography component="div">
							<Box m={1}>Transaction Count</Box>
						</Typography>
					</Grid>
					<Grid item xs={12}>
						<svg
							width={width}
							height={height}
						>
							<Group
								top={margin.top}
								left={margin.left}>
									<GridRows
										scale={yScale}
										width={xMax}
										strokeDasharray="3,3"
										stroke="#919191"
										strokeOpacity={0.3}
										pointerEvents="none"
										numTicks={8} />
									<BarStack
										data={data}
										keys={displayedOrgs}
										value={(d, k) => d[k].length}
										x={getDate}
										xScale={xBandScale}
										yScale={yScale}
										color={(d) => colorScale(d)} >
										{barStacks =>
											barStacks.map(barStack =>
												barStack.bars.map(bar => {
													if (bar.key === 'total') return <div />;
													return (
														<rect
															key={`bar-stack-${barStack.index}-${bar.index}`}
															x={bar.x}
															y={bar.y}
															height={bar.height < 0 ? 0 : bar.height}
															width={bar.width}
															fill={bar.color}
															stroke="#fff"
															opacity={getOpacity(bar.key, bar.index)} />
													);
												})
											)
										}
									</BarStack>
								<Bar
									x = {0}
									y={0}
									width={xMax < 0 ? 0 : xMax}
									height={yMax < 0 ? 0 : yMax}
									fill="transparent"
									rx={14}
									onTouchStart={handleTooltip}
									onTouchMove={handleTooltip}
									onMouseMove={handleTooltip}
									onMouseLeave={() => { hideTooltip(); setHoveredBarStack(); } }/>
								<AxisBottom
									scale={xTimeScale}
									top={yMax}
									tickFormat={customTimeAxisFormat} />
								<AxisLeft
									scale={yScale}
									numTicks={4} />
								{tooltipData && (
									<Line
										from={{ x: tooltipLeft, y: 0 }}
										to={{ x: tooltipLeft, y: yMax }}
										stroke="#919191"
										strokeWidth={1}
										pointerEvents="none"
										strokeDasharray="5,2"	/>
								)}
							</Group>
						</svg>
						{tooltipData && (
							<div>
								<TooltipWithBounds
									key={`tooltip-circle-${tooltipData.time}-tooltip`}
									top={30}
									left={tooltipLeft + 47.5}
									style={{...defaultStyles,	fontSize: '12px'}}
								>
									{tooltipData.orgCounts.map(orgCount => (
										<div key={`tooltip-${orgCount.key}`}>
											{`${orgCount.key}: `}<strong style={{color: colorScale(orgCount.key)}}>{`${orgCount.value} Tx`}</strong>
										</div>
									))}
								</TooltipWithBounds>

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
									<strong>
										{`${moment(tooltipData.time).format('DD.MM., kk:mm')} - ${moment(tooltipData.time + msPerBin).format('DD.MM., kk:mm')}`}
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
														x={0}
														y={0}
														height={legendGlyphSize}
														width={legendGlyphSize}
														strokeWidth={2}
														stroke={label.value}
														fill={
															displayedOrgs.indexOf(label.datum) > -1
																? label.value
																: '#fff'
														}
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
				</Grid>
			</React.Fragment>
		);
	}
);
