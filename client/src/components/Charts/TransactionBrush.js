import React, { useState, useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { LinearGradient } from '@visx/gradient';
import moment from 'moment';

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
	start,
	end,
	onBrushSelectionChange,
	selectedTrxBins,
	formatBinTime,
	msPerBin
}) {
	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

	const [maxTrxCount, setMaxTrxCount] = useState(0);
	const [total, setTotal] = useState([]);
	const [timeDomain, setTimeDomain] = useState([]);

	useEffect(() => {
		const domain = [];
		const dataEntries = data.values();
		for (let entry of dataEntries) {
			if (entry.hasOwnProperty('timestamp'))	domain.push(entry.timestamp);
		}
		setTimeDomain(domain);
	}, [data]);

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
		if (data.size < 1) return;
		const dataEntries = data.values();
		for (let entry of dataEntries) {
			tempTotal.push({
				timestamp: entry.timestamp,
				transactions: [...entry.total.tx]
			});
			maxValue = entry.total.tx.length > maxValue ? entry.total.tx.length : maxValue;
		}
		setTotal(tempTotal);
		setMaxTrxCount(maxValue + maxValue * 0.01);
	}, [data]);

	const xScale = useMemo(
		() =>
			scaleBand({
				range: [0, xMax],
				domain: timeDomain,
				padding: 0.025
			}),
		[xMax, timeDomain]
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

	const getTimeRangeString = () => {
		return `${moment(start).format('DD.MM., kk:mm')} - ${moment(end).format('DD.MM., kk:mm')}`
	};

	return (
		<React.Fragment>
			<Grid container>
				<Grid item xs={4}>
					<div>
						<div>Drag to select a time frame. Currently selected: {getTimeRangeString()}</div>
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
							</Group>
							{total.map(d => {
								const barX = xScale(d.timestamp); // + xScale.bandwidth() / 2;
								const barY = yScale(d.transactions.length);
								const barWidth = xScale.bandwidth();
								const barHeight = yMax - barY < 0 ? 0 : yMax - barY;
								const color =
									selectedTrxBins.get(Math.floor(d.timestamp / msPerBin) )
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
								numTicks={10} />
						</Group>
					</svg>
				</Grid>
			</Grid>
		</React.Fragment>
	);
}

export default TransactionBrush;
