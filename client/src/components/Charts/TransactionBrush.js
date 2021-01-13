import React, { useState, useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { LinearGradient } from '@visx/gradient';

/* istanbul ignore next */
/**
 * Global constants
 */
const defaultMargin = { top: 5, bottom: 30, left: 20, right: 20 };
const backgroundColor = '#58c5c2';
const selectedBrushStyle = { fill: '#919191', opacity: 0.5, stroke: 'white' };

function TransactionBrush({
	width,
	height,
	margin = defaultMargin,
	data,
	onBrushSelectionChange,
	selectedTrxBins,
	formatBinTime
}) {
	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

	const [maxTrxCount, setMaxTrxCount] = useState(0);
	const [total, setTotal] = useState([]);
	useEffect(() => {
		if (document.querySelector(".visx-brush-selection")) { //this a work-around to remove the brush-selection overlay after the displayed data changes
			const brushSelection = document.querySelector(".visx-brush-selection");
			brushSelection.setAttribute('x', '-1');
			brushSelection.setAttribute('y', '-1');
			brushSelection.setAttribute('width', '0');
			brushSelection.setAttribute('height', '0');;
		}
		let maxValue = 0;
		const tempTotal = [];
		if (data.length < 1) return;
		data.forEach(bin => {
			tempTotal.push({
				timestamp: bin.timestamp,
				transactions: [...bin.total]
			});
			maxValue = bin.total.length > maxValue ? bin.total.length : maxValue;
		});
		setTotal(tempTotal);
		setMaxTrxCount(maxValue + maxValue * 0.01);
	}, [data]);

	const xScale = useMemo(
		() =>
			scaleBand({
				range: [0, xMax],
				domain: data.map(d => d.timestamp),
				padding: 0.025
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
					<div>
						<div>Drag to select a time frame:</div>
					</div>
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
								{/* <AreaClosed
									data={total}
									x = { d => xScale(d.timestamp) + xScale.bandwidth() / 2 }
									y = { d => yScale(d.transactions.length) }
									yScale = {yScale}
									strokeWidth = {2}
									stroke = "url(#gradient)"
									fill = "url(#gradient)"
									curve = {curveMonotoneX}
								/> */}
							</Group>
							{total.map(d => {
								const barX = xScale(d.timestamp); // + xScale.bandwidth() / 2;
								const barY = yScale(d.transactions.length);
								const barWidth = xScale.bandwidth();
								const barHeight = yMax - barY < 0 ? 0 : yMax - barY;
								const color =
									selectedTrxBins.filter(bin => bin.timestamp === d.timestamp)
										.length > 0
										? 'rgba(88, 197, 194, .5)'
										: 'rgba(88, 197, 194, .1)';
								return (
									<Bar
										key={`bar-total-${d.timestamp}`}
										x={barX}
										y={barY}
										width={barWidth}
										height={barHeight}
										fill={color}
									/>
								);
							})}
							<Group>
								<Brush
									xScale={xScale}
									yScale={yScale}
									width={xMax}
									height={yMax > 0 ? yMax : 0}
									handleSize={1}
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
								tickFormat={formatBinTime}
								tickLabelProps={() => ({
									fontSize: 11,
									textAnchor: 'middle'
								})}
								numTicks={10}
							/>
						</Group>
					</svg>
				</Grid>
			</Grid>
		</React.Fragment>
	);
}

export default TransactionBrush;
