import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveLinear } from '@visx/curve';
import { Group } from '@visx/group';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { GridRows, GridColumns } from '@visx/grid';
import { withTooltip } from '@visx/tooltip';
import { max } from 'd3';

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
		avgTrxSize,
		displayedOrgs,
		onDisplayedOrgsChange,
		customTimeAxisFormat
	}) => {
		const legendGlyphSize = 20;
		const classes = useStyles();
		const xMax = width - margin.left - margin.right;
		const yMax = height - margin.top - margin.bottom;

		const yMaxValue = useMemo(() => {
			return data
				? max(data, d => d.size) >= avgTrxSize
					? max(data, d => d.size)
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
										numTicks={yMax > 520 ? 8 : 5}
									/>
									{displayedOrgs.map(org => {
										const orgTrx = data.filter(
											trx => trx.creator_msp_id === org
										);
										orgTrx.sort((a, b) => {
											if (new Date(a.createdt) < new Date(b.createdt))
												return -1;
											if (new Date(a.createdt) > new Date(b.createdt)) return 1;
											return 0;
										});
										return (
											<LinePath
												key={`trxSize-${org}`}
												data={orgTrx}
												x={d => xScale(new Date(d.createdt).getTime())}
												y={d => yScale(d.size)}
												strokeWidth={3}
												curve={curveLinear}
												stroke={colorScale(org)}
												shapeRendering="geometricPrecision"
											/>
										);
									})}
								</Group>
								<AxisBottom
									scale={xScale}
									top={yMax}
									numTicks={xMax > 520 ? 8 : 5}
									tickFormat={customTimeAxisFormat}
								/>
								<AxisLeft scale={yScale} numTicks={4} />
							</Group>
						</svg>
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
