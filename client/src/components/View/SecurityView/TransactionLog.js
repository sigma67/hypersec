import React, { useState, useEffect } from 'react';
import { Row, Col } from 'reactstrap';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TransactionSizeChart from '../../Charts/TransactionLog/TransactionSizeChart';
import ProcessingTimeChart from '../../Charts/TransactionLog/ProcessingTimeChart';
import { CardContent } from '@material-ui/core';
import ResizeObserver from 'resize-observer-polyfill';

const useResizeObserver = ref => {
	const [dimensions, setDimensions] = useState(null);
	useEffect(() => {
		const observeTarget = ref.current;
		const resizeObserver = new ResizeObserver(entries => {
			entries.forEach(entry => {
				setDimensions(entry.contentRect);
			});
		});
		resizeObserver.observe(observeTarget);
		return () => {
			resizeObserver.unobserve(observeTarget);
		};
	}, [ref]);
	return dimensions;
};

const initialData = [
	{
		name: 'Page A',
		uv: 4000,
		finished: true,
		valid: true,
		validation: 100,
		ordering: 120,
		endorsement: 140
	},
	{
		name: 'Page B',
		uv: 3000,
		finished: true,
		valid: false,
		validation: 200,
		ordering: 120,
		endorsement: 15
	},
	{
		name: 'Page C',
		uv: 2000,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120
	},
	{
		name: 'Page D',
		uv: 2780,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120
	},
	{
		name: 'Page E',
		uv: 1890,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120
	},
	{
		name: 'Page F',
		uv: 2390,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 50,
		endorsement: 10
	},
	{
		name: 'Page G',
		uv: 3490,
		finished: false,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 0
	}
];

export default function SecurityView() {
	const [transactionData] = useState(initialData);
	const [hoveredTransaction, setHoveredTransaction] = useState({});

	return (
		<CardContent>
			<Row>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Timestamp</TableCell>
							<TableCell>Client-ID</TableCell>
							<TableCell>Size</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Processing Time</TableCell>
						</TableRow>
					</TableHead>
					<TableBody></TableBody>
				</Table>
			</Row>
			<Row>
				<Col sm="6">
					<TransactionSizeChart
						data={transactionData}
						resizeObserver={useResizeObserver}
						hoveredTransaction={hoveredTransaction}
						onTransactionHovered={transaction => setHoveredTransaction(transaction)}
					/>
				</Col>
				<Col sm="6">
					<ProcessingTimeChart
						data={transactionData}
						resizeObserver={useResizeObserver}
						hoveredTransaction={hoveredTransaction}
						onTransactionHovered={transaction => {
							setHoveredTransaction(transaction);
						}}
					/>
				</Col>
			</Row>
		</CardContent>
	);
}
