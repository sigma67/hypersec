/**
 *    SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment';
import MomentUtils from '@date-io/moment';
import Transactions from '../Lists/Transactions';
import TransactionBrush from '../Charts/TransactionBrush';
import TransactionSize from '../Charts/TransactionSize';
import TransactionTime from '../Charts/TransactionTime';
import TransactionCount from '../Charts/TransactionCount';
import { schemePastel2, schemeSet2 } from 'd3-scale-chromatic';
import { scaleOrdinal } from '@visx/scale';
import { Row, Col } from 'reactstrap';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import {
	IconButton,
	InputAdornment,
	Card,
	CardContent,
	InputLabel,
	MenuItem,
	FormControl,
	Select,
	CircularProgress,
	Backdrop
} from '@material-ui/core';
import { Event, Today } from '@material-ui/icons';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import {
	currentChannelType,
	getTransactionType,
	getTransactionInfoType,
	getTransactionListType,
	transactionType,
	transactionListType,
	getMetricsType
} from '../types';
import { timeParse, timeFormat } from 'd3-time-format';

/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
	backdrop: {
		zIndex: theme.zIndex.drawer + 1,
		color: '#fff'
	},
	view: {
		paddingTop: 85,
		paddingLeft: 0,
		width: '80%',
		marginLeft: '10%',
		marginRight: '10%'
	},
	root: {
		flexGrow: 1,
		flexDirection: 'column',
		alignItems: 'center'
	},
	smallSection: {
		marginBottom: '1%',
		/* 		textAlign: 'center', */
		color: theme.palette === 'dark' ? '#ffffff' : undefined,
		backgroundColor: theme.palette === 'dark' ? '#3c3558' : undefined
	},
	largeSection: {
		height:
			0.8 * window.screen.availHeight - (0.8 * window.screen.availHeight) / 8,
		marginBottom: '1.5%',
		textAlign: 'center',
		color: theme.palette === 'dark' ? '#ffffff' : undefined,
		backgroundColor: theme.palette === 'dark' ? '#3c3558' : undefined
	},
	searchButton: {
		backgroundColor: '#58c5c2',
		color: '#ffffff',
		width: '100%',
		'&:hover': {
			backgroundColor: '#419996'
		}
	},
	brushRow: {
		marginBottom: '1rem'
	},
	brushCol: {
		display: 'flex',
		flex: 1,
		height: '5rem'
	},
	detailsRow: {
		marginBottom: '2.5rem'
	},
	detailsCol: {
		display: 'flex',
		flex: 1,
		height: '12rem'
	},
	wrapper: {
		marginTop: '10px',
		position: 'relative',
		width: '100%'
	},
	buttonProgress: {
		color: '#ffffff',
		position: 'absolute',
		top: '50%',
		left: '50%',
		marginTop: -12,
		marginLeft: -12
	},
	activeBinMs: {
		color: '#ffffff',
		backgroundColor: '#58c5c2',
		'&:hover': {
			backgroundColor: '#419996'
		}
	},
	inactiveBinMs: {
		backgroundColor: 'ffffff'
	}
}));

function TransactionsView({
	currentChannel,
	getTransaction,
	getMetrics,
	metrics,
	transaction,
	transactionList,
	getTransactionListSearch,
	transactionByOrg,
	transactionListSearch
}) {
	const classes = useStyles();
	const [end, setEnd] = useState(moment());
	const [start, setStart] = useState(moment().subtract(1, 'days'));
	const [loading, setLoading] = useState(false);
	const [transactions, setTransactions] = useState([]);
	const [binnedTrx, setBinnedTrx] = useState([]);
	const [organisations, setOrganisations] = useState([]);
	const [displayedOrgs, setDisplayedOrgs] = useState([]);
	const [msPerBin, setMsPerBin] = useState(3600000);
	const [avgTrxSize, setAvgTrxSize] = useState(0);
	const [err, setErr] = useState(false);
	const [selectedBins, setSelectedBins] = useState([]);
	const [selectedTrx, setSelectedTrx] = useState([]);
	const [selectedMtrx, setSelectedMtrx] = useState([]);
	const [selectedFrom, setSelectedFrom] = useState(start);
	const [selectedTo, setSelectedTo] = useState(end);

	const orgsColorScale = useMemo(() => {
		return scaleOrdinal({
			range: ['#58c5c2', ...schemePastel2],
			domain: ['total', ...organisations]
		});
	}, [organisations]);

	const orgsHoverColorScale = useMemo(() => {
		return scaleOrdinal({
			range: ['#58c5c2', ...schemeSet2],
			domain: ['total', ...organisations]
		});
	}, [organisations]);

	const binTimeFormat = date => {
		switch (msPerBin) {
			case 60000:
				return timeFormat(
					`${moment(date).format('MMM Do')}, ${moment(date).hours()}:${moment(
						date
					).minutes()}-${moment(date).hours()}:${moment(
						date + msPerBin
					).minutes()}`
				);
			case 3600000:
				return timeFormat(
					`${moment(date).format('MMM Do')}, ${moment(
						date
					).hours()}:00-${moment(date + msPerBin).hours()}:00`
				);
			case 43200000:
				return timeFormat(
					`${moment(date).format('MMM Do')}, ${moment(
						date
					).hours()}:00-${moment(date + msPerBin).hours()}:00`
				);
			case 86400000:
				return timeFormat(
					`${moment(date).format('MMM Do')}, ${moment(
						date
					).hours()}:00 - ${moment(date + msPerBin).format('MMM Do')}, ${moment(
						date
					).hours()}:00`
				);
		}
	};

	useEffect(() => {
		async function fetchData() {
			await handleSearch();
		}
		fetchData();
	}, [start, end]);

	useEffect(() => {
		const tempOrganisations = [];
		transactionByOrg.forEach(element =>
			tempOrganisations.push(element.creator_msp_id)
		);
		setOrganisations(tempOrganisations);
	}, [transactionByOrg]);

	useEffect(() => {
		if (transactionListSearch) {
			setTransactions(transactionListSearch);
			setSelectedTrx(transactionListSearch);
		} else {
			setTransactions([]);
		}
	}, [transactionListSearch]);

	useEffect(() => {
		metrics ? setSelectedMtrx(metrics) : setSelectedMtrx([]);
	}, [metrics]);

	useEffect(() => {
		getAvgTransactionSize();
		binTrx(transactions);
	}, [transactions, msPerBin, binTrx]);

	useEffect(() => {
		if (displayedOrgs.length === 0) {
			setDisplayedOrgs(organisations);
		}
	}, [organisations]);

	const bins = useMemo(() => {
		let currentBinTime = Math.floor(start.valueOf() / msPerBin) * msPerBin;
		let bins = [];
		while (currentBinTime < end) {
			const bin = { timestamp: currentBinTime, total: [] };
			organisations.forEach(org => {
				bin[org] = [];
			});
			bins.push(bin);
			currentBinTime += msPerBin;
		}
		return bins;
	}, [transactions, msPerBin, start, end, organisations]);

	const binTrx = useCallback(() => {
		const startBin = Math.floor(start.valueOf() / msPerBin) * msPerBin;
		const endBin = Math.floor(end.valueOf() / msPerBin) * msPerBin;
		transactions.forEach(transaction => {
			const trxBinTimeStamp =
				Math.floor(moment.utc(transaction.createdt).valueOf() / msPerBin) *
				msPerBin;
			if (trxBinTimeStamp < startBin || trxBinTimeStamp > endBin) return;
			bins
				.find(bin => bin.timestamp === trxBinTimeStamp)
				['total'].push(transaction);
			bins
				.find(bin => bin.timestamp === trxBinTimeStamp)
				[transaction.creator_msp_id].push(transaction);
		});
		setBinnedTrx(bins);
		setSelectedBins(bins);
	}, [transactions, msPerBin, start, end, organisations]);

	const handleDisplayedOrgsChanged = org => {
		if (org === 'total') return;
		const tempOrgs = [...displayedOrgs];
		const index = tempOrgs.indexOf(org);
		index > -1 ? tempOrgs.splice(index, 1) : tempOrgs.push(org);
		setDisplayedOrgs(tempOrgs);
	};

	const getAvgTransactionSize = () => {
		let totalSize = 0;
		let trxCount = 0;
		if (!transactions) return 1;
		transactions.forEach(trx => {
			trxCount++;
			totalSize += trx.size;
		});
		setAvgTrxSize(totalSize / trxCount);
	};

	const searchTransactionList = async channel => {
		let query = `from=${start.toISOString()}&&to=${end.toISOString()}`;
		for (let i = 0; i < organisations.length; i++) {
			query += `&&orgs=${organisations[i]}`;
		}
		let channelhash = currentChannel;
		if (channel !== undefined) {
			channelhash = channel;
		}
		await getTransactionListSearch(channelhash, query);
	};

	const handleSearch = async () => {
		setLoading(true);
		handleBrushSelection([]);
		await searchTransactionList();
		await getMetrics(start / 1000, end / 1000);
		setLoading(false);
	};

	const handleBrushSelection = selectedBinTimestamps => {
		const trxSelection = [];
		const mtrxSelection = [];
		if (selectedBinTimestamps.length < 1) {
			setSelectedBins(binnedTrx);
			setSelectedTrx(transactions);
			setSelectedMtrx(metrics);
			setSelectedFrom(start);
			setSelectedTo(end);
			return;
		}
		metrics.forEach(bin => {
			if (
				selectedBinTimestamps.indexOf(
					Math.floor((bin.time * 1000) / msPerBin) * msPerBin
				) > -1
			) {
				mtrxSelection.push(bin);
			}
		});
		binnedTrx.forEach(bin => {
			if (selectedBinTimestamps.indexOf(bin.timestamp) > -1) {
				trxSelection.push(...bin.total);
			}
		});
		setSelectedBins(
			binnedTrx.filter(bin => selectedBinTimestamps.indexOf(bin.timestamp) > -1)
		);
		setSelectedTrx(trxSelection);
		setSelectedMtrx(mtrxSelection);
		setSelectedFrom(selectedBinTimestamps[0]);
		setSelectedTo(
			selectedBinTimestamps[selectedBinTimestamps.length - 1]
				? selectedBinTimestamps[selectedBinTimestamps.length - 1] + msPerBin / 2
				: selectedBinTimestamps[selectedBinTimestamps.length - 2] + msPerBin / 2
		);
	};

	const handleMsPerBinChange = event => {
		handleBrushSelection([]);
		setMsPerBin(event.target.value);
	};

	return (
		<div className={classes.view}>
			<Backdrop className={classes.backdrop} open={loading}>
				<CircularProgress color="inherit" />
			</Backdrop>
			<Row>
				<Col sm="12" className={classes.root}>
					<Card className={`${classes.smallSection}`} variant="outlined">
						<CardContent>
							<Row>
								<Col xs={5}>
									<MuiPickersUtilsProvider utils={MomentUtils}>
										<DateTimePicker
											label="From"
											value={start}
											format="LLL"
											style={{ width: 100 + '%' }}
											onChange={async date => {
												if (date > end) {
													setErr(true);
													setStart(date);
													setSelectedFrom(date);
												} else {
													setStart(date);
													setSelectedFrom(date);
													await handleSearch();
													setErr(false);
												}
											}}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton>
															<Today />
														</IconButton>
													</InputAdornment>
												)
											}}
										/>
									</MuiPickersUtilsProvider>
								</Col>
								<Col xs={5}>
									<MuiPickersUtilsProvider utils={MomentUtils}>
										<DateTimePicker
											label="To"
											value={end}
											format="LLL"
											style={{ width: 100 + '%' }}
											onChange={async date => {
												if (date < start) {
													setErr(true);
													setSelectedTo(date);
													setEnd(date);
												} else {
													setEnd(date);
													setSelectedTo(date);
													await handleSearch();
													setErr(false);
												}
											}}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton>
															<Event />
														</IconButton>
													</InputAdornment>
												)
											}}
										/>
									</MuiPickersUtilsProvider>
								</Col>
								<Col xs={2}>
									<FormControl style={{ width: 100 + '%' }}>
										<InputLabel id="ms-per-bin-select-label">
											Transactions per
										</InputLabel>
										<Select
											labelId="ms-per-bin-select-label"
											id="ms-per-bin-select"
											value={msPerBin}
											onChange={handleMsPerBinChange}
										>
											<MenuItem
												disabled={end-start > 60000 * 60 * 3}
												value={60000}>{'1m (Time range < 3h)'}
											</MenuItem>
											<MenuItem
												disabled={end-start > 60000 * 60 * 24 * 7}
												value={3600000}>{'1h (Time range < 7d)'}
											</MenuItem>
											<MenuItem value={43200000}>12h</MenuItem>
											<MenuItem value={86400000}>24h</MenuItem>
										</Select>
									</FormControl>
								</Col>
							</Row>
						</CardContent>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col sm="12" className={classes.root}>
					<Card className={`${classes.smallSection}`} variante="outlined">
						<CardContent>
							<Row className={classes.brushRow}>
								<Col sm="12" className={classes.brushCol}>
									<ParentSize debounceTime={10}>
										{({ width, height }) => (
											<TransactionBrush
												width={width}
												height={height}
												data={binnedTrx}
												onBrushSelectionChange={handleBrushSelection}
												selectedTrxBins={selectedBins}
												formatBinTime={binTimeFormat}
											/>
										)}
									</ParentSize>
								</Col>
							</Row>
							<Row className={classes.detailsRow}>
								<Col sm="4" className={classes.detailsCol}>
									<ParentSize debounceTime={10}>
										{({ width, height }) => (
											<TransactionCount
												width={width}
												height={height}
												colorScale={orgsColorScale}
												hoverColorScale={orgsHoverColorScale}
												data={selectedBins}
												msPerBin={msPerBin}
												displayedOrgs={displayedOrgs}
												onDisplayedOrgsChange={handleDisplayedOrgsChanged}
												formatBinTime={binTimeFormat}
											/>
										)}
									</ParentSize>
								</Col>
								<Col sm="4" className={classes.detailsCol}>
									<ParentSize debounceTime={10}>
										{({ width, height }) => (
											<TransactionSize
												width={width}
												height={height}
												colorScale={orgsColorScale}
												data={selectedTrx}
												from={selectedFrom}
												to={selectedTo}
												avgTrxSize={avgTrxSize || 1}
												displayedOrgs={displayedOrgs}
												onDisplayedOrgsChange={handleDisplayedOrgsChanged}
											/>
										)}
									</ParentSize>
								</Col>
								<Col sm="4" className={classes.detailsCol}>
									<ParentSize debounceTime={10}>
										{({ width, height }) => (
											<TransactionTime
												width={width}
												height={height}
												data={selectedMtrx}
												from={selectedFrom}
												to={selectedTo}
											/>
										)}
									</ParentSize>
								</Col>
							</Row>
						</CardContent>
					</Card>
				</Col>
			</Row>
			<Row>
				<Col sm="12">
					<Card className={`${classes.smallSection}`} variant="outlined">
						<CardContent>
							<Row>
								<Col xs={12}>
									<Transactions
										data={selectedTrx}
										currentChannel={currentChannel}
										transactionList={transactionList}
										transaction={transaction}
										getTransaction={getTransaction}
									/>
								</Col>
							</Row>
						</CardContent>
					</Card>
				</Col>
			</Row>
		</div>
	);
}

TransactionsView.propTypes = {
	currentChannel: currentChannelType.isRequired,
	getTransaction: getTransactionType.isRequired,
	getTransactionInfo: getTransactionInfoType,
	getTransactionList: getTransactionListType,
	transaction: transactionType,
	transactionList: transactionListType.isRequired,
	getMetrics: getMetricsType
};

export default TransactionsView;
