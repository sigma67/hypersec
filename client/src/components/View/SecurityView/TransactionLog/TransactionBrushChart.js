/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import {
	axisBottom,
	axisLeft,
	brushX,
	scaleLinear,
	scaleTime,
	select,
	area,
	curveStep
} from 'd3';
import usePrevious from '../usePrevious';
import useResizeObserver from '../useResizeObserver';

function TransactionBrushChart({ data, from, to, children }) {
	const svgRef = useRef();
	const wrapperRef = useRef();
	const maxNumberTrx = useRef(0);
	const [binnedTrx, setBinnedTrx] = useState([]);
	const [selectedTrx, setSelectedTrx] = useState([]);
	const [selection, setSelection] = useState([0, 1.5]);
	const previousSelection = usePrevious(selection);
	const dimensions = useResizeObserver(wrapperRef);

	useEffect(() => {
		const trxPerTimeSlot = [];
		data.forEach(transaction => {
			const binTimestamp = new Date().setTime(
				Math.floor(new Date(transaction.createdt).getTime() / 15000) * 15000
			);
			const currentBin = trxPerTimeSlot.find(
				bin => bin.timestamp === binTimestamp
			);
			if (currentBin) {
				currentBin.transactions.push(transaction);
			} else {
				trxPerTimeSlot.push({
					timestamp: binTimestamp,
					transactions: [transaction]
				});
			}
		});
		trxPerTimeSlot.forEach(transactionBin => {
			maxNumberTrx.current =
				transactionBin.transactions.length > maxNumberTrx.current
					? transactionBin.transactions.length
					: maxNumberTrx.current;
		});
		trxPerTimeSlot.sort((a, b) => {
			if (a.timestamp < b.timestamp) return -1;
			if (a.timestamp > b.timestamp) return 1;
			return 0;
		});
		setBinnedTrx(trxPerTimeSlot);
	}, [data]);

	useEffect(() => {
		if (!dimensions) return;
		const margins = { top: 20, right: 0, bottom: 20, left: 0 };

		const svg = select(svgRef.current);
		svg.attr('height', 80).attr('width', dimensions.width);

		const xScale = scaleTime()
			.domain([new Date(from), new Date(to)])
			.range([0, dimensions.width]);

		// const barWidth = Math.ceil(((5000 / (xScale.domain()[1].getTime() - xScale.domain()[0].getTime())) * dimensions.width));

		const xAxis = svg
			.select('.x-axis')
			.attr('transform', `translate(0,${dimensions.height - margins.bottom})`)
			.call(
				axisBottom(xScale)
					.ticks(dimensions.width / 80)
					.tickSizeOuter(0)
			);

		const yScale = scaleLinear()
			.domain([0, maxNumberTrx.current])
			.range([dimensions.height, 0]);

		const yAxis = svg
			.select('.y-axis')
			.attr('transform', `translate(${margins.left}, 0)`)
			.call(axisLeft(yScale));

		const areaGen = area()
			.curve(curveStep)
			.x(d => xScale(new Date(d.timestamp)))
			.y0(yScale(0) - margins.bottom)
			.y1(d => yScale(d.transactions.length));

		svg
			.select('.area-group')
			.selectAll('.area')
			.data([binnedTrx])
			.join('path')
			.attr('class', 'area')
			.attr('fill', '#69b3a2')
			.attr('stroke', 'currentcolor')
			.attr('strok-width', 1)
			.attr('d', areaGen);

		const brush = brushX()
			.extent([
				[0, 0],
				[dimensions.width, dimensions.height]
			])
			.on('start end', event => {
				if (event.selection) {
					const indexSelection = event.selection.map(xScale.invert);
					setSelection(indexSelection);
					const tempTrx = [];
					binnedTrx
						.filter(
							transactionBin =>
								transactionBin.timestamp >= selection[0] &&
								transactionBin.timestamp <= selection[1]
						)
						.forEach(bin => tempTrx.push(...bin.transactions));
					setSelectedTrx(tempTrx);
				}
			});

		if (previousSelection === selection) {
			svg
				.select('.brush')
				.call(brush)
				.call(brush.move, selection.map(xScale));
		}
	}, [
		from,
		to,
		dimensions,
		binnedTrx,
		previousSelection,
		selection,
		selectedTrx
	]);

	return (
		<React.Fragment>
			<div ref={wrapperRef} style={{ marginBottom: '1rem' }}>
				<svg ref={svgRef}>
					<g className="x-axis" />
					<g className="y-axis" />
					<g className="area-group" />
					<g className="zoom" />
					<g className="brush" />
				</svg>
			</div>
			{children(selectedTrx)}
		</React.Fragment>
	);
}

export default TransactionBrushChart;
