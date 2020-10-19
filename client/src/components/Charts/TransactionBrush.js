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
const defaultMargin = { top: 5, bottom: 30, left: 0, right: 0 };
const backgroundColor = '#58c5c2';
const selectedBrushStyle = { fill: '#919191', opacity: .5, stroke: 'white' }

const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(date));

function TransactionBrush({
	width,
	height,
	margin = defaultMargin,
	data,
	onBrushSelectionChange
}) {

	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

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
				range: [0, xMax],
				domain: data.map(d => d.timestamp),
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

	const onBrushChange = domain => {
		if (!domain) return;
		onBrushSelectionChange(domain.xValues);
	};

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<svg width={width} height={height}>
						<Group top={margin.top} left={margin.left}>
							<Group>
								<LinearGradient
									id="gradient"
									from={backgroundColor}
									fromOpacity={1}
									to={backgroundColor}
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
									width={xMax}
									height={yMax > 0 ? yMax : 0}
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
								top={yMax}
								tickFormat={formatDate}
								tickLabelProps={() => ({
									fontSize: 11,
									textAnchor: 'middle',
								})}
								numTicks={xMax > 1920 ? 20 : 10}
							/>
						</Group>
					</svg>
				</Grid>
			</Grid>
		</React.Fragment>
	);
}

export default TransactionBrush;
