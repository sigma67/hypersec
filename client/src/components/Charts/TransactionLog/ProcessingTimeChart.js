import React, { useRef, useEffect } from 'react';
import { select, range, max } from 'd3';
import { scaleOrdinal, scaleBand, scaleLinear } from 'd3-scale';
import { schemePastel2, schemeDark2 } from 'd3-scale-chromatic';
import { axisBottom, axisLeft } from 'd3-axis';
import { stack, stackOrderNone, stackOffsetNone } from 'd3-shape';

function ProcessingTimeChart({
	data,
	resizeObserver,
	hoveredTransaction,
	onTransactionHovered
}) {
	const svgRef = useRef();
	const wrapperRef = useRef();
	const dimensions = resizeObserver(wrapperRef);
	const selfHover = useRef(false);
	const hoveredKey = useRef(null);
	const keys = ['validation', 'ordering', 'endorsement'];

	useEffect(() => {
		let avg = [0];
		data.forEach(
			d => (avg[0] = avg[0] + (d.validation + d.ordering + d.endorsement))
		);
		avg[0] = avg[0] / data.length;

		if (!dimensions) return;

		const marginBar = { top: 30, right: 0, bottom: 30, left: 40 };
		const legendWidth = dimensions.width / keys.length;
		const colorScale = scaleOrdinal()
			.domain(keys)
			.range(schemePastel2);
		const hoverScale = scaleOrdinal()
			.domain(keys)
			.range(schemeDark2);

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
			.domain([0, max(data, d => d.validation + d.ordering + d.endorsement)])
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
			.text('Seconds');
		svg
			.select('.y-axis')
			.select('.domain')
			.remove();

		const stackGenerator = stack()
			.keys(keys)
			.order(stackOrderNone)
			.offset(stackOffsetNone);
		const stackedData = stackGenerator(data);

		svg
			.select('.bar-group')
			.selectAll('.bar-stack')
			.data(stackedData)
			.join('g')
			.attr('class', 'bar-stack')
			.attr('fill', d => colorScale(d.key))
			.selectAll('.bar')
			.data(d => d)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', (d, i) => xScale(i))
			.attr('y', d => yScale(d[1]))
			.attr('height', d => yScale(d[0]) - yScale(d[1]))
			.attr('width', xScale.bandwidth())
			.attr('fill', function(e) {
				const key = select(this.parentNode).datum().key;
				if (!selfHover.current) {
					return e.data === hoveredTransaction ? hoverScale(key) : colorScale(key);
				}
			})
			.on('mouseenter', function(event, value) {
				onTransactionHovered(value.data);
				selfHover.current = true;
				hoveredKey.current = select(this.parentNode).datum().key;
				svg
					.selectAll('.bar')
					.transition()
					.attr('fill', function(e, i) {
						if (
							value.data.name === e.data.name &&
							hoveredKey.current === select(this.parentNode).datum().key
						) {
							return hoverScale(hoveredKey.current);
						} else {
							return colorScale(select(this.parentNode).datum().key);
						}
					});
			})
			.on('mouseleave', () => {
				onTransactionHovered({});
				selfHover.current = false;
				hoveredKey.current = null;
				svg.selectAll('.bar').attr('fill', function() {
					return colorScale(select(this.parentNode).datum().key);
				});
			});

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
			.data(avg)
			.join('line')
			.attr('class', 'avg-line')
			.attr('x1', xScale(0))
			.attr('x2', dimensions.width - marginBar.right)
			.attr('y1', yScale(avg[0]))
			.attr('y2', yScale(avg[0]))
			.attr('stroke', 'currentcolor')
			.attr('stroke-dasharray', 3)
			.attr('stroke-width', 2)
			.attr('opacity', 0.5);

		svg
			.select('.trendline')
			.selectAll('.trend-text')
			.data(avg)
			.join('text')
			.attr('class', 'trend-text')
			.attr('x', dimensions.width / 2 - 25)
			.attr('y', yScale(avg[0]) - 5)
			.attr('fill', 'currentcolor')
			.text('24h: ' + avg[0].toFixed(2))
			.style('font-size', '11px');

		svg
			.selectAll('.tooltip-text')
			.data(data)
			.join('text')
			.attr('class', 'tooltip-text')
			.attr('fill', 'currentcolor')
			.attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
			.attr('y', d => yScale(0) + 12)
			.attr('opacity', element => (element === hoveredTransaction ? 1 : 0))
			.style('font-size', '11px')
			.style('text-anchor', 'middle')
			.text(element =>
				hoveredKey.current
					? element[hoveredKey.current]
					: element.validation + element.ordering + element.endorsement
			);
	}, [
		data,
		dimensions,
		keys,
		hoveredTransaction,
		onTransactionHovered,
		selfHover
	]);

	// d.validation + d.ordering + d.endorsement

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

export default ProcessingTimeChart;
