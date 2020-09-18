/* eslint-disable */
import React, { useState } from 'react';
import { Row, Col } from 'reactstrap';
import { CardContent } from '@material-ui/core';
import TransactionSizeChart from './TransactionSizeChart';
import ProcessingTimeChart from './ProcessingTimeChart';
import TransactionBrushChart from './TransactionBrushChart';

const initialData = [
	{
		name: 'Page A',
		uv: 4000,
		finished: true,
		valid: true,
		validation: 100,
		ordering: 120,
		endorsement: 140,
		timestamp: Date.now()
	},
	{
		name: 'Page B',
		uv: 3000,
		finished: true,
		valid: false,
		validation: 200,
		ordering: 120,
		endorsement: 15,
		timestamp: Date.now() - 15000
	},
	{
		name: 'Page C',
		uv: 2000,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120,
		timestamp: Date.now() - 14000
	},
	{
		name: 'Page D',
		uv: 2780,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120,
		timestamp: Date.now() - 200
	},
	{
		name: 'Page E',
		uv: 1890,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 120,
		timestamp: Date.now() - 5000
	},
	{
		name: 'Page F',
		uv: 2390,
		finished: true,
		valid: true,
		validation: 120,
		ordering: 50,
		endorsement: 10,
		timestamp: Date.now() - 10000
	},
	{
		name: 'Page G',
		uv: 3490,
		finished: false,
		valid: true,
		validation: 120,
		ordering: 120,
		endorsement: 0,
		timestamp: Date.now() - 3000
	}
];

function TransactionLog() {
	const [transactionData] = useState(initialData);
	const [hoveredTransaction, setHoveredTransaction] = useState({});

	const avgTransactionSize = [0];
	transactionData.forEach(d => (avgTransactionSize[0] += d.uv));
	avgTransactionSize[0] /= transactionData.length;

	const avgProcessingTime = [0];
	transactionData.forEach(
		d => (avgProcessingTime[0] += d.validation + d.ordering + d.endorsement)
	);
	avgProcessingTime[0] /= transactionData.length;

	return (
		<CardContent>
			<Row>
				<Col sm="12">
					<TransactionBrushChart data={transactionData}>
						{selectedTrx => (
							<Row>
								<Col sm="6">
									<TransactionSizeChart
										data={selectedTrx}
										avgTransactionSize={avgTransactionSize}
										hoveredTransaction={hoveredTransaction}
										onTransactionHovered={transaction =>
											setHoveredTransaction(transaction)
										}
									/>
								</Col>
								<Col sm="6">
									<ProcessingTimeChart
										data={selectedTrx}
										avgProcessingTime={avgProcessingTime}
										hoveredTransaction={hoveredTransaction}
										onTransactionHovered={transaction =>
											setHoveredTransaction(transaction)
										}
									/>
								</Col>
							</Row>
						)}
					</TransactionBrushChart>
				</Col>
			</Row>
		</CardContent>
	);
}

export default TransactionLog;
