import React, { useEffect, useState, useMemo } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { AreaClosed, AreaStack, Area } from '@visx/shape';
import { curveMonotoneX, curveMonotoneY } from '@visx/curve';
import { Group } from '@visx/group';
import { max } from 'd3';

/**
 * Global constants
 */
const margin = { top: 10, bottom: 30, left: 50, right: 30 };

const test = d => {
	console.log(d);
	return 0;
};

function TransactionSize({
	parentWidth,
	parentHeight,
	colorScale,
	data,
	binnedData,
	from,
	to,
	avgTrxSize,
	displayedOrgs
}) {
	const [width, setWidth] = useState(0);
	useEffect(() => {
		setWidth(parentWidth > 0 ? parentWidth - margin.left - margin.right : 0);
	}, [parentWidth]);

	const [height, setHeight] = useState(0);
	useEffect(() => {
		setHeight(parentHeight > 0 ? parentHeight - margin.top - margin.bottom : 0);
	}, [parentHeight]);

	const [yMax, setYMax] = useState(avgTrxSize);

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

	const test = [];
	useEffect(() => {
		setYMax(
			data
				? max(data, d => d.size) >= avgTrxSize
					? max(data, d => d.size)
					: avgTrxSize
				: avgTrxSize
		);
		data.forEach(transaction => {
			let temp = {};
			temp['timestamp'] = new Date(transaction.createdt).getTime();
			displayedOrgs.forEach(org => {
				temp[org] = transaction.creator_msp_id === org ? transaction.size : 0;
			});
			test.push(temp);
		});
	}, [data, avgTrxSize]);

	const getTimestamp = d => d.timestamp;
	const getColor = d => {
		return colorScale(d);
	};
	const getValue = d => {
		console.log(d);
		return 1;
	};
	const getY0 = d => countScale(d['0']);
	const getY1 = d => countScale(d['1']);

	return (
		<React.Fragment>
			<svg width={parentWidth} height={parentHeight}>
				<g transform={`translate(${margin.left}, ${margin.top})`}>
					<Group>
						<AreaStack
							data={data}
							keys={displayedOrgs}
							value={getValue}
							xScale={timeScale}
							yScale={countScale}
							x={getTimestamp}
							color={getColor}
						>
							{areaStacks => {
								areaStacks.stacks.map(areaStack => {
									console.log(areaStack);
									areaStack.map(data => {
										return <Area data={data.data} x={test} />;
									});
								});
							}}
						</AreaStack>
					</Group>

					<AxisBottom
						scale={timeScale}
						top={height}
						numTicks={width > 520 ? 10 : 5}
					/>
					<AxisLeft scale={countScale} numTicks={4} />
					<text x="-30" y="10" transform="rotate(-90)" fontSize={10}>
						Size [b]
					</text>
				</g>
			</svg>
		</React.Fragment>
	);
}

export default TransactionSize;
