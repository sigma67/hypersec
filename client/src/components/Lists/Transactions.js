/**
 *    SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable */
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import ReactTable from '../Styled/Table';
import matchSorter from 'match-sorter';
import TransactionView from '../View/TransactionView';

const useStyles = makeStyles(theme => ({

}));

function Transactions({
	data,
	currentChannel,
	transactionList,
	transaction,
	getTransaction,
}) {
	const classes = useStyles();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [filtered, setFiltered] = useState([]);
	const [sorted, setSorted] = useState([]);
	const columnHeaders = [
		{
			Header: 'Creator',
			accessor: 'creator_msp_id',
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['creator_msp_id'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		},
		{
			Header: 'Channel Name',
			accessor: 'channelname',
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['channelname'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		},
		{
			Header: 'Tx Id',
			accessor: 'txhash',
			className: classes.hash,
			Cell: row => (
				<span>
					<a
						data-command="transaction-partial-hash"
						className={classes.partialHash}
						onClick={() => handleDialogOpen(row.value)}
						href="#/transactions"
					>
						<div className={classes.fullHash} id="showTransactionId">
							{row.value}
						</div>{' '}
						{row.value.slice(0, 6)}
						{!row.value ? '' : '... '}
					</a>
				</span>
			),
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['txhash'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		},
		{
			Header: 'Type',
			accessor: 'type',
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['type'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		},
		{
			Header: 'Chaincode',
			accessor: 'chaincodename',
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['chaincodename'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		},
		{
			Header: 'Timestamp',
			accessor: 'createdt',
			filterMethod: (filter, rows) =>
				matchSorter(
					rows,
					filter.value,
					{ keys: ['createdt'] },
					{ threshold: matchSorter.rankings.SIMPLEMATCH }
				),
			filterAll: true
		}
	];
	const handleDialogOpen = async tid => {
		await getTransaction(currentChannel, tid);
		setDialogOpen(true);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
	};

	return (
		<React.Fragment>
			<ReactTable
				data={data}
				columns={columnHeaders}
				defaultPageSize={10}
				list
				filterable
				sorted={sorted}
				onSortedChange={sorted => {
					setSorted(sorted);
				}}
				filtered={filtered}
				onFilteredChange={filtered => {
					setFiltered(filtered);
				}}
				minRows={0}
				style={{ height: '300' }}
				showPagination={!(transactionList.length < 5)}
			/>

			<Dialog
				open={dialogOpen}
				onClose={handleDialogClose}
				fullWidth
				maxWidth="md"
			>
				<TransactionView
					transaction={transaction}
					onClose={handleDialogClose}
				/>
			</Dialog>
		</React.Fragment>
	);
}

export default Transactions;
