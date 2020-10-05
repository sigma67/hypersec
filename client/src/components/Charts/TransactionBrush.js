import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Circle, LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import { curveMonotoneY } from '@visx/curve';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';

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
const selectedBrushStyle = { fill: `url(#${PATTERN_ID})`, stroke: 'white' };
const msPerBin = 3600000; // = 1 hour
const legendGlyphSize = 20;

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
	useEffect(() => {
		let maxValue = 0;
		if (!data[0]) return 1;
		data[0].bins.forEach(bin => {
			maxValue =
				bin.transactions.length > maxValue ? bin.transactions.length : maxValue;
		});
		setMaxTrxCount(maxValue);
	}, [data]);

	const timeScale = useMemo(
		() =>
			scaleTime({
				range: [0, width],
				domain: [
					Math.floor(from / msPerBin) * msPerBin,
					Math.floor(to / msPerBin) * msPerBin
				]
			}),
		[width, from, to]
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
		const { x0, x1 } = domain;
		onBrushSelectionChange(x0, x1);
	};

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
											fill={
												displayedOrgs.indexOf(label.datum) > -1
													? label.value
													: '#fff'
											}
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
						{data.map(orgBin => {
							if (displayedOrgs.indexOf(orgBin.organisation) === -1)
								return <div key={`line-${orgBin.organisation}`} />;
							return (
								<Group key={`line-${orgBin.organisation}`}>
									{orgBin.bins.map(bin => {
										if (bin.transactions.length === 0)
											return <div key={`bin-${bin.timestamp}`} />;
										return (
											<Circle
												key={`point-${bin.timestamp}-${bin.transactions.length}`}
												cx={timeScale(bin.timestamp)}
												cy={countScale(bin.transactions.length)}
												r={5}
												fill={colorScale(orgBin.organisation)}
											/>
										);
									})}
									<LinePath
										curve={curveMonotoneY}
										data={orgBin.bins}
										x={d => {
											return timeScale(d.timestamp);
										}}
										y={d => countScale(d.transactions.length)}
										stroke={colorScale(orgBin.organisation)}
										shapeRendering="geometricPrecision"
									/>
								</Group>
							);
						})}
						<PatternLines
							id={PATTERN_ID}
							height={8}
							width={8}
							stroke={'#58c5c2'}
							strokeWidth={1}
							orientation={['diagonal']}
						/>
						<Brush
							xScale={timeScale}
							yScale={countScale}
							width={width}
							height={height}
							handleSize={8}
							resizeTriggerAreas={['left', 'right']}
							brushDirection="horizontal"
							onChange={onBrushChange}
							onClick={() => onBrushSelectionChange(data, from, to)}
							selectedBoxStyle={selectedBrushStyle}
						/>
					</Group>

					<AxisBottom
						scale={timeScale}
						top={height}
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
