/* eslint-disable */
import React, { useRef, useEffect } from 'react';
import { select, range, max } from 'd3';
import { scaleOrdinal, scaleBand, scaleLinear } from 'd3-scale';
import { schemePastel1, schemeSet1 } from 'd3-scale-chromatic';
import { axisBottom, axisLeft } from 'd3-axis';
import useResizeObserver from '../useResizeObserver';

function TransactionSizeChart({
	data,
	avgTransactionSize,
	hoveredTransaction,
	onTransactionHovered
}) {
	const svgRef = useRef();
	const wrapperRef = useRef();
	const dimensions = useResizeObserver(wrapperRef);
	const keys = ['invalid', 'pending', 'valid'];

	useEffect(() => {
		if (!dimensions) return;

		const marginBar = { top: 20, right: 0, bottom: 30, left: 40 };
		const legendWidth = dimensions.width / keys.length - 20;
		const colorScale = scaleOrdinal()
			.domain(keys)
			.range(schemePastel1);
		const hoverScale = scaleOrdinal()
			.domain(keys)
			.range(schemeSet1);
		const getColor = (hover, element) => {
			const scale = hover ? hoverScale : colorScale;
			if (element.finished) {
				return element.valid ? scale('valid') : scale('invalid');
			}
			return scale('pending');
		};

		const svg = select(svgRef.current);
		svg.attr('height', dimensions.height).attr('width', dimensions.width);

		const xScale = scaleBand()
			.domain(range(data.length))
			.range([marginBar.left, dimensions.width - marginBar.right])
			.padding(0.1);

		const xAxis = axisBottom(xScale).tickValues([]);
		svg
			.select('.x-axis')
			.attr('transform', `translate(0,${dimensions.height - marginBar.bottom})`)
			.call(xAxis);

		const yScale = scaleLinear()
			.domain([0, max(data, d => d.uv) || avgTransactionSize])
			.nice()
			.range([dimensions.height - marginBar.bottom, marginBar.top]);

		const yAxis = axisLeft(yScale).ticks(3);

		svg
			.select('.y-axis')
			.attr('transform', `translate(${marginBar.left}, 0)`)
			.call(yAxis);

		svg
			.select('.y-axis-label')
			.attr('x', -marginBar.left)
			.attr('y', 10)
			.attr('fill', 'currentColor')
			.attr('text-anchor', 'start')
			.text('Bytes');

		svg
			.select('.y-axis')
			.select('.domain')
			.remove();

		svg
			.select('.bar-group')
			.selectAll('.bar')
			.data(data)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', (d, i) => xScale(i))
			.attr('y', d => yScale(d.uv))
			.attr('height', d => yScale(0) - yScale(d.uv))
			.attr('width', xScale.bandwidth())
			.on('mouseenter', (event, value) => onTransactionHovered(value))
			.on('mouseout', () => onTransactionHovered({}))
			.attr('fill', d =>
				d === hoveredTransaction ? getColor(true, d) : getColor(false, d)
			);

		svg
			.select('.legend')
			.selectAll('.legend-dot')
			.data(keys)
			.join('circle')
			.attr('class', 'legend-dot')
			.attr('cx', (d, i) => marginBar.left + legendWidth * i + 3)
			.attr('cy', dimensions.height - 6)
			.attr('r', 6)
			.attr('fill', value => colorScale(value))
			.attr('stroke', value => colorScale(value));

		svg
			.select('.legend')
			.selectAll('.legend-text')
			.data(keys)
			.join('text')
			.attr('class', 'legend-text')
			.attr('x', (d, i) => marginBar.left + legendWidth * i + 15)
			.attr('y', dimensions.height - 6)
			.attr('fill', 'currentColor')
			.text(d => d)
			.style('font-size', '11px')
			.style('alignment-baseline', 'middle');

		svg
			.select('.trendline')
			.selectAll('.avg-line')
			.data(avgTransactionSize)
			.join('line')
			.attr('class', 'avg-line')
			.attr('x1', xScale(0))
			.attr('x2', dimensions.width - marginBar.right)
			.attr('y1', yScale(avgTransactionSize[0]))
			.attr('y2', yScale(avgTransactionSize[0]))
			.attr('stroke', 'currentcolor')
			.attr('stroke-dasharray', 3)
			.attr('stroke-width', 2)
			.attr('opacity', 0.5);

		svg
			.select('.trendline')
			.selectAll('.trend-text')
			.data(avgTransactionSize)
			.join('text')
			.attr('class', 'trend-text')
			.attr('x', dimensions.width / 2 - 25)
			.attr('y', yScale(avgTransactionSize[0]) - 5)
			.attr('fill', 'currentcolor')
			.text('24h: ' + avgTransactionSize[0].toFixed(2))
			.style('font-size', '11px');

		if (data.length < 1) return;
		svg
			.selectAll('.tooltip-text')
			.data(data)
			.join('text')
			.attr('class', 'tooltip-text')
			.attr('fill', 'currentcolor')
			.attr(
				'x',
				element => xScale(data.indexOf(element)) + xScale.bandwidth() / 2
			)
			.attr('y', yScale(0) + 12)
			.attr('opacity', element => (element === hoveredTransaction ? 1 : 0))
			.style('font-size', '11px')
			.style('text-anchor', 'middle')
			.text(element => element.uv);
	}, [
		data,
		avgTransactionSize,
		dimensions,
		keys,
		hoveredTransaction,
		onTransactionHovered
	]);

	return (
		<React.Fragment>
			<div ref={wrapperRef}>
				<svg ref={svgRef}>
					<g className="x-axis" />
					<g className="y-axis">
						<text className="y-axis-label" />
					</g>
					<g className="bar-group" />
					<g className="legend" />
					<g className="trendline" />
				</svg>
			</div>
		</React.Fragment>
	);
}

export default TransactionSizeChart;
