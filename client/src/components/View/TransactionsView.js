/**
 *    SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable */
import React, {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback
} from 'react';
import View from '../Styled/View';
import { makeStyles  } from '@material-ui/core/styles';
import moment from 'moment';
import MomentUtils from '@date-io/moment';
import Transactions from '../Lists/Transactions';
import TransactionBrush from '../Charts/TransactionBrush';
import TransactionSize from '../Charts/TransactionSize';
import TransactionTime from '../Charts/TransactionTime';
import { schemeAccent } from 'd3-scale-chromatic';
import { scaleOrdinal } from '@visx/scale';
import { Row, Col } from 'reactstrap';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import {
	Button,
	IconButton,
	InputAdornment,
	Card,
	CardContent,
	CircularProgress
} from '@material-ui/core';
import { Event, Today, Search } from '@material-ui/icons';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import {
	currentChannelType,
	getTransactionType,
	getTransactionInfoType,
	getTransactionListType,
	transactionType,
	transactionListType
} from '../types';

/* istanbul ignore next */
const useStyles = makeStyles(theme => ({
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
		textAlign: 'center',
		color: theme.palette === 'dark' ? '#ffffff' : undefined,
		backgroundColor: theme.palette === 'dark' ? '#3c3558' : undefined
	},
	largeSection: {
		height:
			0.8 * window.screen.availHeight - (0.8 * window.screen.availHeight) / 8,
		marginBottom: '1%',
		textAlign: 'center',
		color: theme.palette === 'dark' ? '#ffffff' : undefined,
		backgroundColor: theme.palette === 'dark' ? '#3c3558' : undefined
	},
	searchButton: {
		backgroundColor: '#58c5c2',
		color: '#ffffff',
		width: '100%'
	},
	brushRow: {
		marginBottom: '4rem',
		marginTop: '.5rem'
	},
	brushCol: {
		display: 'flex',
		flex: 1,
		height: '10rem'
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
    marginLeft: -12,
	},
	activeBinMs: {
		color: '#ffffff',
		backgroundColor: '#58c5c2'
	},
	inactiveBinMs: {
		backgroundColor: 'ffffff'
	}
}));

function TransactionsView({
	currentChannel,
	getTransaction,
	getTransactionInfo,
	getTransactionList,
	transaction,
	transactionList,
	getTransactionListSearch,
	transactionByOrg,
	transactionListSearch
}) {
	const classes = useStyles();
	const [search, setSearch] = useState(false);
	const [to, setTo] = useState(moment());
	const [from, setFrom] = useState(moment().subtract(1, 'days'));
	const [transactions, setTransactions] = useState([]);
	const [binnedTrx, setBinnedTrx] = useState([]);
	const [organisations, setOrganisations] = useState([]);
	const [displayedOrgs, setDisplayedOrgs] = useState([...organisations]);
	const [msPerBin, setMsPerBin] = useState(3600000);
	const [avgTrxSize, setAvgTrxSize] = useState(0);
	const [filtered, setFiltered] = useState([]);
	const [sorted, setSorted] = useState([]);
	const [err, setErr] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedTrx, setSelectedTrx] = useState([]);
	const [selectedFrom, setSelectedFrom] = useState(from);
	const [selectedTo, setSelectedTo] = useState(to);

	const prevChannel = useRef(currentChannel);
	const interval = useRef();

	const colorScale = useMemo(
		() => {
			return scaleOrdinal({
				range: ['#58c5c2', ...schemeAccent],
				domain: ['total', ...organisations]
			})},
		[organisations]
	);

	useEffect(() => {
		if (search && prevChannel.current !== currentChannel) {
			if (interval.current !== undefined) clearInterval(interval.current);
			interval.current = setInterval(() => {
				this.searchTransactionList(currentChannel);
			}, 60000);
			return () => clearInterval(interval.current);
		}
	}, [currentChannel, search]);

	useEffect(() => {
		const tempOrganisations = [];
		transactionByOrg.forEach(element =>
			tempOrganisations.push(element.creator_msp_id)
		);
		setOrganisations(tempOrganisations);
	}, [transactionByOrg]);

	useEffect(() => {
		search
			? setTransactions(transactionListSearch)
			: setTransactions(transactionList);
	}, [transactionListSearch, transactionList]);

	useEffect(() => {
		getAvgTransactionSize();
		binTrx(transactions);
	}, [transactions, msPerBin, binTrx]);

	const binTrx = useCallback(() => {
		let currentBinTime = Math.floor(from / msPerBin) * msPerBin;
		let bins = [];
		while (currentBinTime < to) {
			const bin = {timestamp: currentBinTime, total: []};
			organisations.forEach(org => {
				bin[org] = [];
			});
			bins.push(bin);
			currentBinTime += msPerBin;
		}
		transactions.forEach((transaction) => {
			const trxBinTimeStamp = new Date().setTime(Math.floor(new Date(transaction.createdt).getTime() / msPerBin) * msPerBin);
			if (trxBinTimeStamp < from ||trxBinTimeStamp > to) return;
			bins.find(bin => bin.timestamp === trxBinTimeStamp)['total'].push(transaction);
			bins.find(bin => bin.timestamp === trxBinTimeStamp)[transaction.creator_msp_id].push(transaction);
		});
		setBinnedTrx(bins);
	}, [transactions, msPerBin, from, to, organisations]);

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
		let query = `from=${new Date(from).toString()}&&to=${new Date(
			to
		).toString()}`;
		for (let i = 0; i < organisations.length; i++) {
			query += `&&orgs=${organisations[i]}`;
		}
		let channelhash = currentChannel;
		if (channel !== undefined) {
			channelhash = channel;
		}
		setLoading(true);
		await getTransactionListSearch(channelhash, query);
		setLoading(false);
	};

	const handleSearch = async () => {
		if (interval.current !== undefined) clearInterval(interval.current);
		interval.current = setInterval(() => {
			searchTransactionList();
		}, 60000);
		await searchTransactionList();
		setSearch(true);
	};

	const handleClearSearch = () => {
		setSearch(false);
		setTo(moment());
		setFrom(moment().subtract(1, 'days'));
		setErr(false);
	};

	const handleBrushSelection = (selectedBins) => {
		const selection = [];
		if(selectedBins.length < 1) {
			setSelectedTrx(selection);
			setSelectedFrom(from);
			setSelectedTo(to);
			return;
		}
		binnedTrx.forEach(bin => {
			if (selectedBins.indexOf(bin.timestamp) > -1) {
				selection.push(...bin.total);
			}
		});
		setSelectedTrx(selection);
		setSelectedFrom(selectedBins[0]);
		setSelectedTo(
			selectedBins[selectedBins.length - 1] ?
			selectedBins[selectedBins.length - 1] + msPerBin / 2 :
			selectedBins[selectedBins.length - 2] + msPerBin / 2
		);
	};

	return (
		<div className={classes.view}>
		<Row>
			<Col sm="12" className={classes.root}>
				<Card className={`${classes.smallSection}`} variant="outlined">
					<CardContent>
						<Row>
							<Col xs={4}>
								<MuiPickersUtilsProvider utils={MomentUtils}>
									<DateTimePicker
										label="From"
										value={from}
										format="LLL"
										style={{ width: 100 + '%' }}
										onChange={date => {
											if (date > to) {
												setErr(true);
												setFrom(date);
											} else {
												setFrom(date);
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
										label="To"
										value={to}
										format="LLL"
										style={{ width: 100 + '%' }}
										onChange={date => {
											if (date < from) {
												setErr(true);
												setTo(date);
											} else {
												setTo(date);
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
								<div className={classes.wrapper}>
									<Button
										variant="contained"
										className={classes.searchButton}
										disabled={err || loading}
										onClick={async () => {
											await handleSearch();
										}}
									>
										<Search /> Search
									</Button>
									{loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
								</div>
							</Col>
							<Col xs={2}>
								<ButtonGroup className={classes.wrapper}>
									<Button variant='contained' className={msPerBin===3600000 ? classes.activeBinMs : classes.inactiveBinMs} onClick={() => setMsPerBin(3600000)}>1 hour</Button>
									<Button variant='contained' className={msPerBin===43200000 ? classes.activeBinMs : classes.inactiveBinMs} onClick={() => setMsPerBin(43200000)}>12 hours</Button>
									<Button variant='contained' className={msPerBin===86400000 ? classes.activeBinMs : classes.inactiveBinMs} onClick={() => setMsPerBin(86400000)}>1 day</Button>
								</ButtonGroup>
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
									{({ width: visWidth, height: visHeight }) => (
										<TransactionBrush
											parentWidth={visWidth}
											parentHeight={visHeight}
											colorScale={colorScale}
											data={binnedTrx}/*  */
											onBrushSelectionChange={handleBrushSelection}
											displayedOrgs={displayedOrgs}
											onDisplayedOrgsChange={handleDisplayedOrgsChanged}
										/>
									)}
								</ParentSize>
							</Col>
						</Row>
						<Row>
							<Col sm="6" className={classes.brushCol}>
								<ParentSize debounceTime={10}>
									{({ width: visWidth, height: visHeight }) => (
										<TransactionSize
											parentWidth={visWidth}
											parentHeight={visHeight}
											colorScale={colorScale}
											data={selectedTrx}
											from={selectedFrom}
											to={selectedTo}
											avgTrxSize={avgTrxSize || 1}
											displayedOrgs={displayedOrgs}
										/>
									)}
								</ParentSize>
							</Col>
							<Col sm="6" className={classes.brushCol}>
								<ParentSize debounceTime={10}>
									{({ width: visWidth, height: visHeight }) => (
										<TransactionTime
											parentWidth={visWidth}
											parentHeight={visHeight}
											data={selectedTrx}
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
									data = {selectedTrx}
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
	transactionList: transactionListType.isRequired
};

export default TransactionsView;
