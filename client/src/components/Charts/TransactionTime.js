import React, { useEffect, useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { AreaStack } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { Grid } from '@visx/grid';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { timeParse, timeFormat } from 'd3-time-format';
import { schemePastel2 } from 'd3-scale-chromatic';
import { scaleOrdinal } from '@visx/scale';
import { max } from 'd3';

/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
	legend: {
		lineHeight: '0.9em',
		color: '#000',
		fontSize: '11px',
		paddingTop: '5px',
		paddingBottom: '5px',
		float: 'left',
		marginLeft: '40px'
	},
}));

/**
 * Global constants
 */
const margin = { top: 10, bottom: 30, left: 50, right: 30 };
const keys = ['endorser_proposal', 'broadcast_enqueue', 'broadcast_validate'];
const legendGlyphSize = 20;

const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(new Date(date).getTime()));

function TransactionTime({ parentWidth, parentHeight, data, from, to }) {
	const classes = useStyles();

	const [width, setWidth] = useState(0);
	useEffect(() => {
		setWidth(parentWidth > 0 ? parentWidth - margin.left - margin.right : 0);
	}, [parentWidth]);

	const [height, setHeight] = useState(0);
	useEffect(() => {
		setHeight(parentHeight > 0 ? parentHeight - margin.top - margin.bottom : 0);
	}, [parentHeight]);

	const [yMax, setYMax] = useState(0.005);

	const [displayedKeys, setDisplayedKeys] = useState(keys);

	const areaColorScale = useMemo(
		() => {
			return scaleOrdinal({
				range: schemePastel2,
				domain: keys
			})},
		[]
	);

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

	const handleDisplayedMetricsChange = metric => {
		const tempKeys = [...displayedKeys];
		const index = tempKeys.indexOf(metric);
		index > -1 ? tempKeys.splice(index, 1) : tempKeys.push(metric);
		setDisplayedKeys(tempKeys);
	};

	useEffect(() => {
		setYMax(data ? max(data, d => parseFloat(d.endorser_proposal) + parseFloat(d.broadcast_enqueue) + parseFloat(d.broadcast_validate)) : 0);

	}, [data])

	return (
		<React.Fragment>
			<div className={classes.legend} style={{ cursor: 'pointer' }}>
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
												x = { 0 }
												y = { 0 }
												height = {legendGlyphSize }
												width = { legendGlyphSize }
												strokeWidth = { 2 }
												stroke={ label.value }
												fill={ displayedKeys.indexOf(label.datum) > -1 ? label.value : '#fff'	}
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
									)
								}
							)}
						</div>
					)}
				</LegendOrdinal>
			</div>
			<svg width={parentWidth} height={parentHeight}>
				<g transform={`translate(${margin.left}, ${margin.top})`}>
					<Grid
						xScale={timeScale}
						yScale={countScale}
						width={parentWidth}
						height={height}
						numTicksRows={4}
						numTicksColumns={width > 520 ? 8 : 5}
						strokeDasharray="3,3"
						stroke="#919191"
						strokeOpacity={0.3}
					/>
					<Group>
						<AreaStack
							top={margin.top}
							left={margin.left}
							keys={displayedKeys}
							data={data ? data : []}
							x={d => timeScale(d.data.time*1000)}
							y0={d => countScale(d[0])}
							y1={d => countScale(d[1])}
							color={d => areaColorScale(d)}
							curve={curveMonotoneX}
						/>
					</Group>
					<AxisBottom
						scale={timeScale}
						top={height}
						numTicks={width > 520 ? 8 : 5}
						tickFormat={formatDate}
					/>
					<AxisLeft scale={countScale} numTicks={4} />
					<text x="-30" y="10" transform="rotate(-90)" fontSize={10}>
						Time [s]
					</text>
				</g>
			</svg>
		</React.Fragment>
	);
}

export default TransactionTime;
