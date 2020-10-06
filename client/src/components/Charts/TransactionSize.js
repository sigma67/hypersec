import React, { useEffect, useState, useMemo } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { max } from 'd3';
import { timeParse, timeFormat } from 'd3-time-format';

/**
 * Global constants
 */
const margin = { top: 10, bottom: 30, left: 50, right: 30 };

const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(new Date(date).getTime()));

function TransactionSize({
	parentWidth,
	parentHeight,
	colorScale,
	data,
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
	useEffect(() => {
		setYMax(
			data
				? max(data, d => d.size) >= avgTrxSize
					? max(data, d => d.size)
					: avgTrxSize
				: avgTrxSize
		);
	}, [data, avgTrxSize]);

	return (
		<React.Fragment>
			<svg width={parentWidth} height={parentHeight}>
				<g transform={`translate(${margin.left}, ${margin.top})`}>
					<Group>
						{displayedOrgs.map(org => {
							const orgTrx = data.filter(trx => trx.creator_msp_id === org);
							orgTrx.sort((a, b) => {
								if (new Date(a.createdt) < new Date(b.createdt)) return -1;
								if (new Date(a.createdt) > new Date(b.createdt)) return 1;
								return 0;
							});
							return (
								<LinePath
									key = { `trxSize-${org}` }
									data = { orgTrx }
									x = { d => timeScale(new Date(d.createdt).getTime()) }
									y = { d => countScale(d.size) }
									strokeWidth = { 3 }
									curve = { curveMonotoneX }
									stroke = { colorScale(org) }
									shapeRendering = "geometricPrecision"
								/>
							)
						})}
					</Group>
					<AxisBottom
						scale={timeScale}
						top={height}
						numTicks={width > 520 ? 8 : 5}
						tickFormat={formatDate}
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
