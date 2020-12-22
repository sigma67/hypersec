/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import { LegendOrdinal } from '@visx/legend';
import { scaleOrdinal, scaleLinear } from '@visx/scale';
import { InputLabel,
	MenuItem,
	FormControl,
	Select} from '@material-ui/core';
import { withTooltip,
	Tooltip,
	defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import * as d3 from 'd3';
import useResizeObserver from './useResizeObserver';
import Peers from '../Lists/Peers';

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
		paddingTop: 85,
		paddingLeft: 0,
		width: '80%',
		marginLeft: '10%',
		marginRight: '10%'
	},
	card: {
		height: 0.6 * window.screen.availHeight - (0.6 * window.screen.availHeight) / 8,
		padding: theme.spacing(2),
		textAlign: 'center',
		color: theme.palette.text.secondary,
	},
	networkGraph: {
		height: '100%',
		width: '100%'
	}
}));

const defaultMargin = { top: 5, bottom: 30, left: 0, right: 0 };

const peerTypeColorScale = scaleOrdinal({
	range: [...d3.schemeTableau10],
	domain: ['PEER', 'ORDERER']
});

export default withTooltip(
	({
		peerList,
		getLogs,
		logs,
		tooltipOpen,
		tooltipLeft,
		tooltipTop,
		tooltipData,
		showTooltip,
		hideTooltip
	}) => {
		const classes = useStyles();

		const hotLinkColorScale = scaleLinear({
			domain: [0, 1],
			range: ['#5173a5', '#bc584f'],
		});

		const wrapperRef = useRef();

		const nodeData = useMemo(() => {
			return [
				{mspid: 'PeerParent', server_hostname: 'PeerParent', peer_type: 'PeerParent', connected: true},
				{mspid: 'OrdererParent', server_hostname: 'OrdererParent', peer_type: 'OrdererParent', connected: true},
				...peerList
			];
		}, [peerList]);

		const linkData = useMemo(() => {
			const links = [];
			nodeData.forEach(node => {
				if (!node.connected) {
					links.push({source: node.peer_type === 'PEER' ? nodeData[0] : nodeData[1], target: node});
				} else {
					if (node.peer_type === 'PeerParent' || node.peer_type === 'OrdererParent') return;
					if (node.peer_type === 'PEER') links.push({source: node, target: nodeData[0]}, {source: node, target: nodeData[1]});
					if (node.peer_type === 'ORDERER') links.push({source: node, target: nodeData[1]}, {source: node, target: nodeData[0]});
				}
			});
			return links;
		}, [nodeData]);

		/*
		 *const svg = d3.select(svgRef.current);
		 *
		 // links
		 *const links = svg.selectAll('.link')
		 *.data(linkData)
		 *.join('line')
		 *.attr('class', 'link')
		 *.attr('id', (d) => `${d.source.server_hostname}->${d.target.server_hostname}`)
		 *.attr('target_host', (d) => d.target.server_hostname)
		 *.attr('source_host', (d) => d.source.server_hostname)
		 *.attr('stroke', (d) => hotLinkColorScale(d.hot))
		 *.attr('stroke-width', 5)
		 *.attr('fill', 'none')
		 *.on('mouseover', (mouseOver) => {
		 *const targetHostname = mouseOver.target.attributes.target_host.nodeValue;
		 *const sourceHostname = mouseOver.target.attributes.source_host.nodeValue;
		 *
		 *d3.selectAll('.link')
		 *	.transition().duration(300)
		 *	.attr('opacity', (link) => (link.source.server_hostname === sourceHostname && link.target.server_hostname === targetHostname ? 1 : 0.25))
		 *	.attr('stroke-width', (link) => (link.source.server_hostname === sourceHostname && link.target.server_hostname === targetHostname ? 10 : 5));
		 *
		 *d3.selectAll('.linkLabel')
		 *	.transition().duration(300)
		 *	.attr('opacity', (link) => (link.source.server_hostname === sourceHostname && link.target.server_hostname === targetHostname ? 0 : 0.25));
		 *
		 *d3.selectAll('.node')
		 *	.transition().duration(300)
		 *	.attr('opacity', (node) => (node.server_hostname === targetHostname || node.server_hostname === sourceHostname ? 1 : 0.5));
		 *
		 *d3.selectAll('.nodeLabel')
		 *	.transition().duration(300)
		 *	.attr('opacity', (node) => (node.server_hostname === targetHostname || node.server_hostname === sourceHostname ? 1 : 0.25));
		 *
		 *showTooltip({
		 *	tooltipData: {
		 *		'type': 'link',
		 *		'hoveredLink': linkData.filter(d => `${d.source.server_hostname}->${d.target.server_hostname}` === mouseOver.target.id)[0]
		 *	},
		 *	tooltipLeft: mouseOver.x,
		 *	tooltipTop: mouseOver.y
		 *});
		 *})
		 *.on('mouseleave', () => {
		 *d3.selectAll('.link')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1)
		 *	.attr('stroke-width', 5);
		 *
		 *d3.selectAll('.linkLabel')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *d3.selectAll('.node')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *d3.selectAll('.nodeLabel')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *hideTooltip();
		 *});
		 *
		 // nodes
		 *const nodes = svg.selectAll('.node')
		 *.data(nodeData)
		 *.join('circle')
		 *.attr('class', 'node')
		 *.attr('id', (d) => d.server_hostname)
		 *.attr('r', 10)
		 *.attr('stroke', '#fff')
		 *.attr('stroke-width', 1)
		 *.attr('fill', (d) => peerTypeColorScale(d.peer_type))
		 *.on('mouseover', (mouseOver) => {
		 *d3.selectAll('.node')
		 *	.transition().duration(300)
		 *	.attr('r', (node) => (node.server_hostname === mouseOver.target.id ? 20 : 10))
		 *	.attr('opacity', (node) => (node.server_hostname === mouseOver.target.id ? 1 : 0.5));
		 *
		 *d3.selectAll('.nodeLabel')
		 *	.transition().duration(300)
		 *	.attr('opacity', (node) => (node.server_hostname === mouseOver.target.id ? 0 : 0.25));
		 *
		 *d3.selectAll('.link')
		 *	.transition().duration(300)
		 *	.attr('opacity', (link) => (link.source.server_hostname === mouseOver.target.id || link.target.server_hostname === mouseOver.target.id ? 1 : 0.25));
		 *
		 *d3.selectAll('.linkLabel')
		 *	.transition().duration(300)
		 *	.attr('opacity', (link) => (link.source.server_hostname === mouseOver.target.id || link.target.server_hostname === mouseOver.target.id ? 1 : 0.25));
		 *
		 *showTooltip({
		 *	tooltipData: {
		 *		'type': 'node',
		 *		'hoveredNode': nodeData.filter(d => d.server_hostname === mouseOver.target.id)[0]
		 *	},
		 *	tooltipLeft: mouseOver.x,
		 *	tooltipTop: mouseOver.y
		 *});
		 *})
		 *.on('mouseleave', () => {
		 *d3.selectAll('.node')
		 *	.transition().duration(150)
		 *	.attr('r', 10)
		 *	.attr('opacity', 1);
		 *
		 *d3.selectAll('.nodeLabel')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *d3.selectAll('.link')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *d3.selectAll('.linkLabel')
		 *	.transition().duration(150)
		 *	.attr('opacity', 1);
		 *
		 *hideTooltip();
		 *});
		 *
		 // labels for nodes
		 *const nodeLabels = svg.selectAll('.nodeLabel')
		 *.data(nodeData)
		 *.join('text')
		 *.attr('class', 'nodeLabel')
		 *.attr('text-anchor', 'middle')
		 *.attr('font-size', 12)
		 *.text(node => node.server_hostname);
		 *
		 // labels for links
		 *const linkLabels = svg.selectAll('.linkLabel')
		 *.data(linkData)
		 *.join('text')
		 *.attr('class', 'linkLabel')
		 *.attr('dy', '-5')
		 *.attr('dx', '-10')
		 *.attr('text-anchor', 'middle')
		 *.attr('font-size', 12)
		 *.text(link => link.hot);
		 *
		 // d3 force directed simulation
		 *const simulation = d3.forceSimulation(nodeData)
		 *.force('link', d3.forceLink().id((d) => d.hot))
		 *.force('charge', d3.forceManyBody().strength(-100).distanceMax(200))
		 *.force('collide', d3.forceCollide(30))
		 *.on('tick', () => {
		 *console.log(simulation.alpha());
		 // links
		 *links
		 *	.attr('x1', link => link.source.x)
		 *	.attr('y1', link => link.source.y)
		 *	.attr('x2', link => link.target.x)
		 *	.attr('y2', link => link.target.y);
		 *
		 // nodes
		 nodes
		 *	.attr('cx', node => node.x)
		 *	.attr('cy', node => node.y);
		 *
		 // labels for nodes
		 *nodeLabels
		 *	.attr('x', node => node.x)
		 *	.attr('y', node => node.y + 25);
		 *
		 // labels for links
		 *linkLabels
		 *	.attr('transform', (d) => {
		 *		const angle = Math.atan((d.source.y - d.target.y) / (d.source.x - d.target.x)) * 180 / Math.PI;
		 *		return 'translate(' + [(d.source.x + d.target.x) / 2, (d.source.y + d.target.y) / 2] + ')rotate(' + angle + ')';
		 *	});
		 *
		 *});
		 */

		useEffect(() => {
			let destroyFn;

			if (wrapperRef.current) {
				const { destroy } = runForceGraph(wrapperRef.current, linkData, nodeData, showTooltip, hideTooltip);
				destroyFn = destroy;
			}

			return destroyFn;
		}, [linkData, nodeData, showTooltip, hideTooltip]);

		return (
			<div className={classes.root}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Card className={classes.card} variant="outlined">
							<div ref={wrapperRef} className={classes.networkGraph} />
							{tooltipOpen && tooltipData && tooltipData.type === 'node' && (
								<Tooltip
									top={tooltipTop}
									left={tooltipLeft}
									style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white' }}
								>
									<div>
										<strong>{tooltipData.hoveredNode.server_hostname}</strong>
									</div>
									<div style={{ marginTop: '5px', fontSize: '12px' }}>
								MSP: <strong>{tooltipData.hoveredNode.mspid}</strong>
										<br />
								Status: <strong style={{color: `${tooltipData.hoveredNode.status === 'DOWN' ? 'red' : 'green'}`}}>{tooltipData.hoveredNode.status}</strong>
										<br />
								Type: <strong style={{color: `${peerTypeColorScale(tooltipData.hoveredNode.peer_type)}`}}>{tooltipData.hoveredNode.peer_type}</strong>
									</div>
								</Tooltip>
							)}
							{tooltipOpen && tooltipData && tooltipData.type === 'link' && (
								<Tooltip
									top={tooltipTop}
									left={tooltipLeft}
									style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white' }}
								>
									<div>
										<strong>{`${tooltipData.hoveredLink.source.server_hostname} -> ${tooltipData.hoveredLink.target.server_hostname}`}</strong>
									</div>
									<div style={{ marginTop: '5px', fontSize: '12px' }}>
								Hot: {tooltipData.hoveredLink.hot} (<strong style={{color: 'red'}}>+ 10%</strong>)
									</div>
								</Tooltip>
							)}
						</Card>
					</Grid>
					<Grid item xs={12}>
						<Peers peerList={peerList} getLogs={getLogs} logs={logs} />
					</Grid>
				</Grid>
			</div>

		);
	}
);

function runForceGraph(
	container,
	linksData,
	nodesData,
	showTooltip,
	hideTooltip
) {
	const peersData = [nodesData[0], ...nodesData.filter(d => d.peer_type === 'PEER')];
	const orderersData = [nodesData[1], ...nodesData.filter(d => d.peer_type === 'ORDERER')];

	const containerRect = container.getBoundingClientRect();
	const height = containerRect.height;
	const width = containerRect.width;
	const specification = {
		nodeRadius: 12,
		nodeStrokeWidth: 2,
		hoverFactor: 0.25,
	};

	const mouseOverNode = (d) => {
		if (d.target.id === 'PeerParent' || d.target.id === 'OrdererParent') return;

		d3.selectAll('.peerNode')
			.transition().duration(300)
			.attr('r', (node) => (node.server_hostname === d.target.id ? specification.nodeRadius * 2 : specification.nodeRadius))
			.attr('opacity', (node) => (node.server_hostname === d.target.id ? 1 : specification.hoverFactor));

		d3.selectAll('.ordererNode')
			.transition().duration(300)
			.attr('width', (node) => (node.server_hostname === d.target.id ? specification.nodeRadius * 4 : specification.nodeRadius * 2))
			.attr('height', (node) => (node.server_hostname === d.target.id ? specification.nodeRadius * 4 : specification.nodeRadius * 2))
			.attr('opacity', (node) => (node.server_hostname === d.target.id ? 1 : specification.hoverFactor));

		d3.selectAll('.nodeLabel')
			.transition().duration(300)
			.attr('opacity', (node) => (node.server_hostname === d.target.id ? 0 : 0.25));

		d3.selectAll('.linkPath')
			.transition().duration(300)
			.attr('opacity', (link) => (link.source.server_hostname === d.target.id || link.target.server_hostname === d.target.id ? 1 : specification.hoverFactor));

		showTooltip({
			tooltipData: {
				'type': 'node',
				'hoveredNode': nodesData.filter(node => node.server_hostname === d.target.id)[0]
			},
			tooltipLeft: d.x,
			tooltipTop: d.y
		});
	};

	const mouseLeave = () => {
		d3.selectAll('.peerNode')
			.transition().duration(150)
			.attr('r', specification.nodeRadius)
			.attr('opacity', 1);

		d3.selectAll('.ordererNode')
			.transition().duration(300)
			.attr('width', specification.nodeRadius * 2)
			.attr('height', specification.nodeRadius * 2)
			.attr('opacity', 1);

		d3.selectAll('.nodeLabel')
			.transition().duration(300)
			.attr('opacity', 1);

		d3.selectAll('.linkPath')
			.transition().duration(150)
			.attr('opacity', 1);

		hideTooltip();
	};

	const simulation = d3
		.forceSimulation(nodesData)
		.force('link', d3.forceLink(linksData).id(d => d.hot))
		.force('charge', d3.forceManyBody().strength(-100))
		.force('collide', d3.forceCollide(50))
		.force('x', d3.forceX())
		.force('y', d3.forceY());

	const svg = d3
		.select(container)
		.append('svg')
		.attr('viewBox', [-width / 2, -height / 2, width, height]);

	const link = svg
		.append('g')
		.attr('class', 'links')
		.selectAll('.linkPath')
		.data(linksData)
		.join('path')
		.attr('class', 'linkPath')
		.attr('stroke', '#999')
		.attr('fill', 'none')
		.attr('stroke-width', 1.5);

	const ordererNode = svg
		.append('g')
		.attr('class', 'orderers')
		.selectAll('.ordererNode')
		.data(orderersData)
		.join('rect')
		.attr('class', 'ordererNode')
		.attr('id', (d) => d.server_hostname)
		.attr('stroke', (d) => (d.server_hostname === 'OrdererParent' ? '#999' : '#fff'))
		.attr('stroke-width', specification.nodeStrokeWidth)
		.attr('fill', (d) => {
			if (d.server_hostname === 'OrdererParent') return '#fff';
			return d.connected ? peerTypeColorScale(d.peer_type) : '#999';
		})
		.attr('width', specification.nodeRadius * 2)
		.attr('height', specification.nodeRadius * 2)
		.on('mouseover', (d) => mouseOverNode(d))
		.on('mouseleave', mouseLeave);

	const peerNode = svg
		.append('g')
		.attr('class', 'peers')
		.selectAll('.peerNode')
		.data(peersData)
		.join('circle')
		.attr('class', 'peerNode')
		.attr('id', (d) => d.server_hostname)
		.attr('stroke', (d) => (d.server_hostname === 'PeerParent' ? '#999' : '#fff'))
		.attr('stroke-width', specification.nodeStrokeWidth)
		.attr('r', specification.nodeRadius)
		.attr('fill', (d) => {
			if (d.server_hostname === 'PeerParent') return '#fff';
			return d.connected ? peerTypeColorScale(d.peer_type) : '#999';
		})
		.on('mouseover', (d) => mouseOverNode(d))
		.on('mouseleave', mouseLeave);

	const nodeLabels = svg
		.append('g')
		.attr('class', 'nodeLabels')
		.selectAll('.nodeLabel')
		.data(nodesData)
		.join('text')
		.attr('class', 'nodeLabel')
		.attr('text-anchor', 'middle')
		.attr('font-size', 12)
		.text(node => (node.server_hostname === 'OrdererParent' || node.server_hostname === 'PeerParent' ? '' : node.server_hostname));

	simulation.on('tick', () => {
		link
			.attr('d', d => {
				const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
				return `
    			M${d.source.x},${d.source.y}
    			A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  			`;
			});

		ordererNode
			.attr('x', d => d.x - specification.nodeRadius)
			.attr('y', d => d.y - specification.nodeRadius);

		peerNode
			.attr('cx', d => d.x)
			.attr('cy', d => d.y);

		nodeLabels
			.attr('x', node => node.x)
			.attr('y', node => node.y + specification.nodeRadius * 2);
	});

	return {
		destroy: () => {
			simulation.stop();
		},
		nodes: () => {
			return svg.node();
		}
	};
}
