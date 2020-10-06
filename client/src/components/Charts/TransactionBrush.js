import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath, BarStack } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import { curveMonotoneX } from '@visx/curve';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import { timeParse, timeFormat } from 'd3-time-format';

/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
	legend: {
		lineHeight: '0.9em',
		color: '#000',
		fontSize: '10px',
		paddingTop: '10px',
		paddingBottom: '10px',
		float: 'left',
		marginLeft: '40px'
	}
}));

/**
 * Global constants
 */
const margin = { top: 10, bottom: 30, left: 40, right: 0 };
const PATTERN_ID = 'brush_pattern';
// const selectedBrushStyle = { fill: `url(#${PATTERN_ID})`, stroke: 'white' };
const selectedBrushStyle = { fill: '#919191', opacity: .5, stroke: 'white' }
const legendGlyphSize = 20;

const getDate = d => d.timestamp;
const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(date));

function TransactionBrush({
	parentWidth,
	parentHeight,
	colorScale,
	data,
	from,
	to,
	onBrushSelectionChange,
	displayedOrgs,
	onDisplayedOrgsChange
}) {
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
		setMaxTrxCount(maxValue);
	}, [data]);

	const barStackScale = useMemo(
		() =>
			scaleBand({
				range: [0, width],
				domain: data.map(d => getDate(d)),
				padding: 0.4
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
			<div className={classes.legend} style={{ cursor: 'pointer' }}>
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
										<line
											stroke={label.value}
											strokeWidth={2}
											x1={0}
											x2={legendGlyphSize}
											y1={legendGlyphSize / 2}
											y2={legendGlyphSize / 2}
										/>
										<circle
											fill={ displayedOrgs.indexOf(label.datum) > -1 ? label.value : '#fff'	}
											cx={legendGlyphSize / 2}
											cy={legendGlyphSize / 2}
											r="5"
											stroke={label.value}
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
			<svg width={parentWidth} height={parentHeight}>
				<g transform={`translate(${margin.left}, ${margin.top})`}>
					<Group>
						<BarStack
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
											x = { bar.x }
											y = { bar.y }
											height = { bar.height }
											width = { bar.width }
											fill = { bar.color }
										/>
									)})
								)
							}
						</BarStack>
					</Group>
					<Group>
						<LinePath
							curve = { curveMonotoneX }
							data = { total }
							x = { d => (barStackScale(d.timestamp) + barStackScale.bandwidth() / 2) }
							y = { d => countScale(d.transactions.length) }
							stroke={colorScale('total')}
							strokeWidth = {2}
							strokeDasharray = {'9, 5'}
							shapeRendering="geometricPrecision"
						/>
{/* 						{total.map(bin => (
							<Circle
								key = {`total-point-${bin.timestamp}`}
								cx = { barStackScale(bin.timestamp) + barStackScale.bandwidth() / 2 }
								cy = { countScale(bin.transactions.length) }
								r = { 5 }
								fill={ '#fff'	}
								stroke = { colorScale('total') }
							/>
						))} */}
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
						numTicks={width > 520 ? 20 : 10}
					/>
					<AxisLeft scale={countScale} numTicks={4} />
					<text x="-30" y="10" transform="rotate(-90)" fontSize={10}>
						Trx / h
					</text>
				</g>
			</svg>
		</React.Fragment>
	);
}

export default TransactionBrush;
