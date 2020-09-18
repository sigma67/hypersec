/* eslint-disable */
import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableContainer from '@material-ui/core/TableContainer';

function createData(name, calories, fat, carbs, protein) {
	return { name, calories, fat, carbs, protein };
}

const rows = [
	createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
	createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
	createData('Eclair', 262, 16.0, 24, 6.0),
	createData('Cupcake', 305, 3.7, 67, 4.3),
	createData('Gingerbread', 356, 16.0, 49, 3.9)
];

function TransactionLogTable({ data }) {
	return (
		<React.Fragment>
			<TableContainer>
				<Table size="small" aria-label="a dense table">
					<TableHead>
						<TableRow>
							<TableCell>Dessert (100g serving)</TableCell>
							<TableCell align="right">Calories</TableCell>
							<TableCell align="right">Fat&nbsp;(g)</TableCell>
							<TableCell align="right">Carbs&nbsp;(g)</TableCell>
							<TableCell align="right">Protein&nbsp;(g)</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map(row => (
							<TableRow key={row.name}>
								<TableCell component="th" scope="row">
									{row.name}
								</TableCell>
								<TableCell align="right">{row.calories}</TableCell>
								<TableCell align="right">{row.fat}</TableCell>
								<TableCell align="right">{row.carbs}</TableCell>
								<TableCell align="right">{row.protein}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* 	<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>Timestamp</TableCell>
						<TableCell>Client-ID</TableCell>
						<TableCell>Size</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Processing Time</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{data.map((trx) => (
					<TableRow key={trx.name}>
						<TableCell component="th" scope="row">{trx.timestamp}</TableCell>
						<TableCell align="right">Client-Id</TableCell>
						<TableCell align="right">{trx.uv}</TableCell>
						<TableCell align="right">{trx.finished ? "finished" : "pending"}</TableCell>
						<TableCell align="right">{trx.ordering + trx.validation + trx.endorsement}</TableCell>
					</TableRow>
				))}
				</TableBody>
			</Table> */}
		</React.Fragment>
	);
}

export default TransactionLogTable;
