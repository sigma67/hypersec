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
import { schemeTableau10 } from 'd3-scale-chromatic';
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
import { timeFormat } from 'd3-time-format';
import {timeDay, timeHour, timeMinute, timeMonth, timeSecond, timeWeek, timeYear} from 'd3-time';
import Button from '@material-ui/core/Button';
import UpdateIcon from '@material-ui/icons/Update';

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
	const [msPerSizeBin, setMsPerSizeBin] = useState(0);
	const [avgTrxSize, setAvgTrxSize] = useState(0);
	const [err, setErr] = useState(false);
	const [selectedBins, setSelectedBins] = useState([]);
	const [sizeBins, setSizeBins] = useState([]);
	const [selectedSizeBins, setSelectedSizeBins] = useState([]);
	const [selectedTrx, setSelectedTrx] = useState([]);
	const [selectedMtrx, setSelectedMtrx] = useState([]);
	const [selectedFrom, setSelectedFrom] = useState(start);
	const [selectedTo, setSelectedTo] = useState(end);

	const orgsColorScale = useMemo(() => {
		return scaleOrdinal({
			range: [...schemeTableau10],
			domain: [...organisations]
		});
	}, [organisations]);

	const formatMillisecond = timeFormat(".%L"),
		formatSecond = timeFormat(":%S"),
		formatMinute = timeFormat("%H:%M"),
		formatHour = timeFormat("%H:%M"),
		formatDay = timeFormat("%d.%m."),
		formatWeek = timeFormat("%b %d"),
		formatMonth = timeFormat("%B"),
		formatYear = timeFormat("%Y");

	function customTimeAxisFormat(date) {
		return (timeSecond(date) < date ? formatMillisecond
			: timeMinute(date) < date ? formatSecond
				: timeHour(date) < date ? formatMinute
					: timeDay(date) < date ? formatHour
						: timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
							: timeYear(date) < date ? formatMonth
								: formatYear)(date);
	}

	const binTimeFormat = date => {
		switch (msPerBin) {
			case 60000: //1m
				const fromMins = moment(date).minutes() < 10 ? `0${moment(date).minutes()}` : moment(date).minutes();
				const toMins = moment(date + msPerBin).minutes() < 10 ? `0${moment(date + msPerBin).minutes()}` : moment(date + msPerBin).minutes();
				return timeFormat(
					`${moment(date).hours()}:${fromMins}-${moment(date).hours()}:${toMins}`
				);
			case 3600000: //1h
				return timeFormat(
					`${moment(date).format('DD.MM.')}, ${moment(
						date
					).hours()}:00-${moment(date + msPerBin).hours()}:00`
				);
			case 43200000: //12h
				return timeFormat(
					`${moment(date).format('DD.MM.')}, ${moment(
						date
					).hours()}:00-${moment(date + msPerBin).hours()}:00`
				);
			case 86400000: //24h
				return timeFormat(
					`${moment(date).format('DD.MM.')}, ${moment(
						date
					).hours()}:00 - ${moment(date + msPerBin).format('DD.MM.')}, ${moment(
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
		if (end.valueOf() - start.valueOf() > 10800000 && msPerBin < 3600000) setMsPerBin(3600000); //if msPerBin = 1min and range > 3h set msPerBin = 1h
		if (end.valueOf() - start.valueOf() > 604800000 && msPerBin < 43200000) setMsPerBin(43200000); //if msPerBin = 1h and range > 7d set msPerBin = 12h
		setMsPerSizeBin(Math.floor((end.valueOf() - start.valueOf()) / 100)); //max 100 container for size

	}, [start, end]);

	useEffect(() => {
		const tempOrganisations = [];
		transactionByOrg.forEach(element =>
			tempOrganisations.push(element.creator_msp_id)
		);
		setOrganisations(tempOrganisations.sort());
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
		binTrx();
		buildSizeBins();
	}, [transactions, msPerBin, binTrx, buildSizeBins]);

	useEffect(() => {
		if (displayedOrgs.length === 0) {
			setDisplayedOrgs(organisations);
		}
	}, [organisations]);


	const binTrx = useCallback(() => {
		let currentBinTime = Math.floor(start.valueOf() / msPerBin) * msPerBin;
		let bins = [];
		while (currentBinTime <= end) {
			const bin = { timestamp: currentBinTime, total: [] };
			organisations.forEach(org => {
				bin[org] = [];
			});
			bins.push(bin);
			currentBinTime += msPerBin;
		}

		const startBin = Math.floor(start.valueOf() / msPerBin) * msPerBin;
		const endBin = Math.floor(end.valueOf() / msPerBin) * msPerBin;
		transactions.forEach(transaction => {
			const trxBinTimeStamp =	Math.floor(moment.utc(transaction.createdt).valueOf() / msPerBin) * msPerBin;
			if (trxBinTimeStamp < startBin || trxBinTimeStamp > endBin) return;
			bins
				.find(bin => bin.timestamp === trxBinTimeStamp)
				['total'].push(transaction);
			bins
				.find(bin => bin.timestamp === trxBinTimeStamp)
				[transaction.creator_msp_id].push(transaction);
		});

		setBinnedTrx(bins);
		setSelectedFrom(bins.length > 0 ? moment(bins[0].timestamp) : start);
		setSelectedTo(bins.length > 0 ? moment(bins[bins.length-1].timestamp + msPerBin) : end);
		setSelectedBins(bins);
	}, [transactions, msPerBin, start, end, organisations]);

	const buildSizeBins = useCallback(() => {
		let currentBinTime = Math.floor(start.valueOf() / msPerSizeBin) * msPerSizeBin;
		let bins = [];
		while (currentBinTime < end.valueOf()) {
			const bin = { timestamp: currentBinTime, totalSize: 0, totalCount: 0 };
			organisations.forEach(org => {
				bin[org] = { size: 0, count: 0};
			});
			bins.push(bin);
			currentBinTime += msPerSizeBin;
		}

		transactions.forEach(tx => {
			const binTimestamp = Math.floor(moment.utc(tx.createdt).valueOf() / msPerSizeBin) * msPerSizeBin;
			const bin = bins.filter(bin => bin.timestamp === binTimestamp)[0];
			if ( !bin || !bin[tx.creator_msp_id] ) return;
			bin.totalSize += tx.size;
			bin.totalCount ++;
			bin[tx.creator_msp_id].size += tx.size;
			bin[tx.creator_msp_id].count ++;
		});

		setSizeBins(bins);
		setSelectedSizeBins(bins);
	}, [transactions, msPerBin, start, end, organisations]);

	const handleDisplayedOrgsChanged = org => {
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
		await getMetrics(start / 1000, Math.min(end / 1000, Date.now() / 1000));
		setLoading(false);
	};

	const handleBrushSelection = selectedBinTimestamps => {
		const trxSelection = [];
		const mtrxSelection = [];
		if (selectedBinTimestamps.length < 1) {
			setSelectedBins(binnedTrx);
			setSelectedSizeBins(sizeBins);
			setSelectedTrx(transactions);
			setSelectedMtrx(metrics);
			setSelectedFrom(binnedTrx.length > 0 ? moment(binnedTrx[0].timestamp) : start);
			setSelectedTo(binnedTrx.length > 0 ? moment(binnedTrx[binnedTrx.length-1].timestamp) : end);
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

		setSelectedSizeBins(
			sizeBins.filter(bin => bin.timestamp >= selectedBinTimestamps[0] && bin.timestamp <= selectedBinTimestamps[selectedBinTimestamps.length - 1] + msPerBin)
		);

		setSelectedTrx(trxSelection);
		setSelectedMtrx(mtrxSelection);
		setSelectedFrom(selectedBinTimestamps[0]);
		setSelectedTo(
			selectedBinTimestamps[selectedBinTimestamps.length - 1]
				? selectedBinTimestamps[selectedBinTimestamps.length - 1] + msPerBin
				: selectedBinTimestamps[selectedBinTimestamps.length - 2] + msPerBin
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
								<Col xs={4}>
									<MuiPickersUtilsProvider utils={MomentUtils}>
										<DateTimePicker
											disableFuture
											ampm={false}
											label="From"
											value={start}
											format="MMMM Do, yyyy (dddd) - HH:mm"
											helperText={err ? `Needs to be before 'To'.` : ``}
											style={{ width: 100 + '%' }}
											onChange={async date => {
												if (date > end) {
													setErr(true);
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
								<Col xs={4}>
									<MuiPickersUtilsProvider utils={MomentUtils}>
										<DateTimePicker
											disableFuture
											ampm={false}
											label="To"
											value={end}
											format="MMMM Do, yyyy (dddd) - HH:mm"
											helperText={err ? `Needs to be after 'From'.` : ``}
											style={{ width: 100 + '%' }}
											onChange={async date => {
												if (date < start) {
													setErr(true);
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
								<Col xs={1}>
									<Button
										variant="contained"
										color="default"
										style={{ width: 100 + '%', marginTop: '10px' }}
										startIcon={<UpdateIcon />}
										onClick={async () => {
											setEnd(moment());
											setSelectedTo(moment());
											await handleSearch();
											setErr(false);
										}}>
										Refresh
									</Button>
								</Col>
								<Col xs={3}>
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
												msPerBin={msPerBin}
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
												data={selectedBins}
												from={selectedFrom}
												to={selectedTo}
												msPerBin={msPerBin}
												displayedOrgs={displayedOrgs}
												onDisplayedOrgsChange={handleDisplayedOrgsChanged}
												formatBinTime={binTimeFormat}
												customTimeAxisFormat={customTimeAxisFormat}
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
												data={selectedSizeBins}
												from={selectedFrom}
												to={selectedTo}
												msPerBin={msPerSizeBin}
												avgTrxSize={avgTrxSize || 1}
												displayedOrgs={displayedOrgs}
												onDisplayedOrgsChange={handleDisplayedOrgsChanged}
												customTimeAxisFormat={customTimeAxisFormat}
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
												customTimeAxisFormat={customTimeAxisFormat}
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
