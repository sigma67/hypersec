import React, { useEffect, useState, useMemo } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { AreaClosed } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { max } from 'd3';
import { Grid } from '@visx/grid';
import { timeParse, timeFormat } from 'd3-time-format';

/**
 * Global constants
 */
const margin = { top: 10, bottom: 30, left: 50, right: 30 };

const parseDate = timeParse('%Q');
const format = timeFormat('%b %d, %H:%M');
const formatDate = (date) => format(parseDate(new Date(date).getTime()));

function TransactionTime({ parentWidth, parentHeight, data, from, to }) {
	const [width, setWidth] = useState(0);
	useEffect(() => {
		setWidth(parentWidth > 0 ? parentWidth - margin.left - margin.right : 0);
	}, [parentWidth]);

	const [height, setHeight] = useState(0);
	useEffect(() => {
		setHeight(parentHeight > 0 ? parentHeight - margin.top - margin.bottom : 0);
	}, [parentHeight]);

	const [yMax, setYMax] = useState(1);

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

	useEffect(() => {}, [data]);

	return (
		<React.Fragment>
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
