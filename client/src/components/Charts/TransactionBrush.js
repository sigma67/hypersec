import React, { useState, useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { AreaClosed } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { timeParse, timeFormat } from 'd3-time-format';



/* istanbul ignore next */
/**
 * Global constants
 */
const margin = { top: 5, bottom: 30, left: 10, right: 10 };
const background = '#58c5c2';
const selectedBrushStyle = { fill: '#919191', opacity: .5, stroke: 'white' }

const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(date));

function TransactionBrush({
	parentWidth,
	parentHeight,
	data,
	onBrushSelectionChange
}) {

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

	const xScale = useMemo(
		() =>
			scaleBand({
				range: [0, width],
				domain: data.map(d => d.timestamp),
			}),
		[width, data]
	);

	const yScale = useMemo(
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

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<svg width={parentWidth} height={parentHeight}>
						<g transform={`translate(${margin.left}, ${margin.top})`}>
							<Group>
								<LinearGradient
									id="gradient"
									from={background}
									fromOpacity={1}
									to={background}
									toOpacity={0.2}
								/>
								<AreaClosed
									data={total}
									x = { d => xScale(d.timestamp) + xScale.bandwidth() / 2 }
									y = { d => yScale(d.transactions.length) }
									yScale = {yScale}
									strokeWidth = {2}
									stroke = "url(#gradient)"
									fill = "url(#gradient)"
									curve = {curveMonotoneX}
								/>
							</Group>
							<Group>
								<Brush
									xScale={xScale}
									yScale={yScale}
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
								scale={xScale}
								top={height}
								tickFormat={formatDate}
								tickLabelProps={() => ({
									fontSize: 11,
									textAnchor: 'middle',
								})}
								numTicks={width > 1920 ? 20 : 10}
							/>
						</g>
					</svg>
				</Grid>
			</Grid>
		</React.Fragment>
	);
}

export default TransactionBrush;
