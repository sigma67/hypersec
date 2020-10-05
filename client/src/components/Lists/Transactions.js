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
import { Button, Row, Col } from 'reactstrap';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import moment from 'moment';
import MomentUtils from '@date-io/moment';
import {
	IconButton,
	InputAdornment,
	Card,
	CardContent
} from '@material-ui/core';
import { Event, Today, Search } from '@material-ui/icons';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReactTable from '../Styled/Table';
import matchSorter from 'match-sorter';
import TransactionView from '../View/TransactionView';
import TransactionBrush from '../Charts/TransactionBrush';
import TransactionSize from '../Charts/TransactionSize';
import TransactionTime from '../Charts/TransactionTime';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { scaleOrdinal } from '@visx/scale';

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
	customButton: {
		opacity: 0.8,
		marginTop: '10px',
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
	}
}));

const msPerBin = 3600000;

function Transactions({
	currentChannel,
	transactionList,
	getTransactionList,
	transaction,
	transactionByOrg,
	getTransactionInfo,
	getTransaction,
	getTransactionListSearch,
	transactionListSearch
}) {
	const classes = useStyles();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [search, setSearch] = useState(false);
	const [to, setTo] = useState(moment());
	const [from, setFrom] = useState(moment().subtract(1, 'days'));

	const [organisations, setOrganisations] = useState([]);
	useEffect(() => {
		const tempOrganisations = [];
		transactionByOrg.forEach(element =>
			tempOrganisations.push(element.creator_msp_id)
		);
		setOrganisations(tempOrganisations);
	}, [transactionByOrg]);

	const colorScale = useMemo(
		() =>
			scaleOrdinal({
				range: schemeCategory10,
				domain: ['total', ...organisations]
			}),
		[organisations]
	);

	const [displayedOrgs, setDisplayedOrgs] = useState(['total']);
	const handleDisplayedOrgsChanged = org => {
		const tempOrgs = [...displayedOrgs];
		const index = tempOrgs.indexOf(org);
		index > -1 ? tempOrgs.splice(index, 1) : tempOrgs.push(org);
		setDisplayedOrgs(tempOrgs);
	};

	const [avgTrxSize, setAvgTrxSize] = useState(0);
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

	const [transactions, setTransactions] = useState([]);
	useEffect(() => {
		search
			? setTransactions(transactionListSearch)
			: setTransactions(transactionList);
	}, [transactionListSearch, transactionList]);

	const [binnedTrx, setBinnedTrx] = useState([{ org: 'total', bins: [] }]);
	const binTrx = useCallback(() => {
		let currentBin = Math.floor(from / msPerBin) * msPerBin;
		let binByOrg = [{ organisation: 'total', bins: [] }];

		organisations.forEach(org =>
			binByOrg.push({ organisation: org, bins: [] })
		);
		while (currentBin < to) {
			binByOrg.forEach(orgBins =>
				orgBins.bins.push({ timestamp: currentBin, transactions: [] })
			);
			currentBin += msPerBin;
		}
		transactions.forEach(transaction => {
			const binTimestamp = new Date().setTime(
				Math.floor(new Date(transaction.createdt).getTime() / msPerBin) *
					msPerBin
			);
			if (binTimestamp <= from || binTimestamp > to) return;
			binByOrg[0].bins
				.find(bin => bin.timestamp === binTimestamp)
				.transactions.push(transaction);
			for (let i = 1; i < binByOrg.length; i++) {
				if (transaction.creator_msp_id === binByOrg[i].organisation) {
					binByOrg[i].bins
						.find(bin => bin.timestamp === binTimestamp)
						.transactions.push(transaction);
				}
			}
		});
		binByOrg.forEach(orgBins => {
			orgBins.bins.sort((a, b) => {
				if (new Date(a.timestamp) < new Date(b.timestamp)) return -1;
				if (new Date(a.timestamp) > new Date(b.timestamp)) return 1;
				return 0;
			});
			orgBins.bins.forEach(bin => {
				bin.transactions.sort((a, b) => {
					if (new Date(a.createdt) < new Date(b.createdt)) return -1;
					if (new Date(a.createdt) > new Date(b.createdt)) return 1;
					return 0;
				});
			});
		});
		setBinnedTrx(binByOrg);
	}, [transactions, from, to, organisations]);
	useEffect(() => {
		binTrx(transactions);
	}, [transactions, binTrx]);

	const [selection, setSelection] = useState(null);
	useEffect(() => {
		getAvgTransactionSize();
		const currentSelection = {};
		transactions.forEach(element => {
			currentSelection[element.blocknum] = false;
		});
		setSelection(currentSelection);
	}, [transactions]);

	const [filtered, setFiltered] = useState([]);
	const [sorted, setSorted] = useState([]);
	const [err, setErr] = useState(false);
	const prevChannel = useRef(currentChannel);
	const interval = useRef();
	useEffect(() => {
		if (search && prevChannel.current !== currentChannel) {
			if (interval.current !== undefined) clearInterval(interval.current);
			interval.current = setInterval(() => {
				this.searchTransactionList(currentChannel);
			}, 60000);
			return () => clearInterval(interval.current);
		}
	}, [currentChannel, search]);

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
		await getTransactionListSearch(channelhash, query);
	};

	const handleDialogOpen = async tid => {
		await getTransaction(currentChannel, tid);
		setDialogOpen(true);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
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
		setOrganisations([]);
		setErr(false);
	};

	const handleEye = (row, val) => {
		const data = Object.assign({}, selection, { [row.index]: !val });
		setSelection(data);
	};

	const [selectedBinnedTrx, setSelectedBinnedTrx] = useState([]);
	const [selectedTrx, setSelectedTrx] = useState([]);
	const [selectedFrom, setSelectedFrom] = useState(from);
	const [selectedTo, setSelectedTo] = useState(to);
	const handleBrushSelection = (selectionStart, selectionEnd) => {
		const tmpSelectedTrx = [];
		const tmpSelectedBinnedTrx = [];
		binnedTrx.forEach(orgBin => {
			const binTransactions = [];
			orgBin.bins
				.filter(
					bin => bin.timestamp > selectedFrom && bin.timestamp < selectedTo
				)
				.forEach(bin => binTransactions.push(...bin.transactions));
			tmpSelectedBinnedTrx.push({
				organisation: orgBin.organisation,
				transactions: binTransactions
			});
		});

		if (displayedOrgs.indexOf('total') > -1) {
			binnedTrx[0].bins
				.filter(
					bin => bin.timestamp > selectedFrom && bin.timestamp < selectedTo
				)
				.forEach(bin => tmpSelectedTrx.push(...bin.transactions));
		} else {
			for (let i = 0; i < displayedOrgs.length; i++) {
				binnedTrx.forEach(orgaBin => {
					if (orgaBin.organisation === displayedOrgs[i]) {
						orgaBin.bins
							.filter(
								bin =>
									bin.timestamp > selectedFrom && bin.timestamp < selectedTo
							)
							.forEach(bin => tmpSelectedTrx.push(...bin.transactions));
					}
				});
			}
		}
		tmpSelectedTrx.sort((a, b) => {
			if (new Date(a.createdt) < new Date(b.createdt)) return -1;
			if (new Date(a.createdt) > new Date(b.createdt)) return 1;
			return 0;
		});

		setSelectedBinnedTrx(tmpSelectedBinnedTrx);
		setSelectedTrx(tmpSelectedTrx);
		setSelectedFrom(selectionStart);
		setSelectedTo(selectionEnd);
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
									<Button
										className={classes.customButton}
										color="success"
										disabled={err}
										onClick={async () => {
											await handleSearch();
										}}
									>
										<Search /> Search
									</Button>
								</Col>
								<Col xs={1}>
									<Button
										onClick={() => {
											handleClearSearch();
										}}
										className={classes.customButton}
										color="primary"
									>
										Reset
									</Button>
								</Col>
								<Col xs={1}>
									<Button
										onClick={() => {
											setFiltered([]);
											setSorted([]);
										}}
										color="secondary"
										className={classes.customButton}
									>
										Clear
									</Button>
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
												data={binnedTrx}
												from={from}
												to={to}
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
												binnedData={selectedBinnedTrx}
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
									<ReactTable
										data={selectedTrx}
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
								</Col>
							</Row>
						</CardContent>
					</Card>
				</Col>
			</Row>

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
		</div>
	);
}

/*  Transactions.propTypes = {
	 currentChannel: currentChannelType.isRequired,
	 getTransaction: getTransactionType.isRequired,
	 transaction: transactionType,
	 transactionList: transactionListType.isRequired
	 };

	 Transactions.defaultProps = {
	 transaction: null
	 };
 */
export default Transactions;

/* istanbul ignore next */
/*
 * const styles = theme => {
 * const { type } = theme.palette;
 * const dark = type === 'dark';
 * return {
 * hash: {
 * '&, & li': {
 *	 overflow: 'visible !important'
 * }
 * },
 * partialHash: {
 * textAlign: 'center',
 * position: 'relative !important',
 * '&:hover $lastFullHash': {
 *	 marginLeft: -400
 * },
 * '&:hover $fullHash': {
 *	 display: 'block',
 *	 position: 'absolute !important',
 *	 padding: '4px 4px',
 *	 backgroundColor: dark ? '#5e558e' : '#000000',
 *	 marginTop: -30,
 *	 marginLeft: -215,
 *	 borderRadius: 8,
 *	 color: '#ffffff',
 *	 opacity: dark ? 1 : undefined
 * }
 * },
 * fullHash: {
 * display: 'none'
 * },
 * lastFullHash: {},
 * filter: {
 * width: '100%',
 * textAlign: 'center',
 * margin: '0px !important'
 * },
 * filterButton: {
 * opacity: 0.8,
 * margin: 'auto',
 * width: '100% !important',
 * 'margin-bottom': '4px'
 * },
 * searchButton: {
 * opacity: 0.8,
 * margin: 'auto',
 * width: '100% !important',
 * backgroundColor: dark ? undefined : '#086108',
 * 'margin-bottom': '4px'
 * },
 * filterElement: {
 * textAlign: 'center',
 * display: 'flex',
 * padding: '0px !important',
 * '& > div': {
 *	 width: '100% !important',
 *	 marginTop: 20
 * },
 * '& .label': {
 *	 margin: '25px 10px 0px 10px'
 * }
 * }
 * };
 * };
 *
 * export class Transactions extends Component {
 * constructor(props) {
 * super(props);
 * this.state = {
 * dialogOpen: false,
 * search: false,
 * to: moment(),
 * orgs: [],
 * options: [],
 * filtered: [],
 * sorted: [],
 * err: false,
 * from: moment().subtract(1, 'days')
 * };
 * }
 *
 * componentDidMount() {
 * const { transactionList } = this.props;
 * const selection = {};
 * transactionList.forEach(element => {
 * selection[element.blocknum] = false;
 * });
 * const opts = [];
 * this.props.transactionByOrg.forEach(val => {
 * opts.push({ label: val.creator_msp_id, value: val.creator_msp_id });
 * });
 * this.setState({ selection, options: opts });
 * }
 *
 * componentWillReceiveProps(nextProps) {
 * if (
 * this.state.search &&
 * nextProps.currentChannel !== this.props.currentChannel
 * ) {
 * if (this.interval !== undefined) {
 *	 clearInterval(this.interval);
 * }
 * this.interval = setInterval(() => {
 *	 this.searchTransactionList(nextProps.currentChannel);
 * }, 60000);
 * this.searchTransactionList(nextProps.currentChannel);
 * }
 * }
 *
 * componentWillUnmount() {
 * clearInterval(this.interVal);
 * }
 *
 * handleCustomRender(selected, options) {
 * if (selected.length === 0) {
 * return 'Select Orgs';
 * }
 * if (selected.length === options.length) {
 * return 'All Orgs Selected';
 * }
 *
 * return selected.join(',');
 * }
 *
 * searchTransactionList = async channel => {
 * let query = `from=${new Date(this.state.from).toString()}&&to=${new Date(
 * this.state.to
 * ).toString()}`;
 * for (let i = 0; i < this.state.orgs.length; i++) {
 * query += `&&orgs=${this.state.orgs[i]}`;
 * }
 * let channelhash = this.props.currentChannel;
 * if (channel !== undefined) {
 * channelhash = channel;
 * }
 * await this.props.getTransactionListSearch(channelhash, query);
 * };
 *
 * handleDialogOpen = async tid => {
 * const { currentChannel, getTransaction } = this.props;
 * await getTransaction(currentChannel, tid);
 * this.setState({ dialogOpen: true });
 * };
 *
 * handleMultiSelect = value => {
 * this.setState({ orgs: value });
 * };
 *
 * handleDialogClose = () => {
 * this.setState({ dialogOpen: false });
 * };
 *
 * handleSearch = async () => {
 * if (this.interval !== undefined) {
 * clearInterval(this.interval);
 * }
 * this.interval = setInterval(() => {
 * this.searchTransactionList();
 * }, 60000);
 * await this.searchTransactionList();
 * this.setState({ search: true });
 * };
 *
 * handleClearSearch = () => {
 * this.setState({
 * search: false,
 * to: moment(),
 * orgs: [],
 * err: false,
 * from: moment().subtract(1, 'days')
 * });
 * };
 *
 * handleEye = (row, val) => {
 * const { selection } = this.state;
 * const data = Object.assign({}, selection, { [row.index]: !val });
 * this.setState({ selection: data });
 * };
 *
 * render() {
 * const { classes } = this.props;
 * const transactionList = this.state.search
 * ? this.props.transactionListSearch
 * : this.props.transactionList;
 * const { transaction } = this.props;
 * const { dialogOpen } = this.state;
 * return (
 * <React.Fragment>
 *	 <Card className={`${classes.section}`} variant="outlined">
 *		 <CardHeader title="Transaction Details"></CardHeader>
 *		 <CardContent>
 *			 <ReactTable
 *				 data={transactionList}
 *				 columns={columnHeaders}
 *				 defaultPageSize={10}
 *				 list
 *				 filterable
 *				 sorted={this.state.sorted}
 *				 onSortedChange={sorted => {
 *					 this.setState({ sorted });
 *				 }}
 *				 filtered={this.state.filtered}
 *				 onFilteredChange={filtered => {
 *					 this.setState({ filtered });
 *				 }}
 *				 minRows={0}
 *				 style={{ height: '750px' }}
 *				 showPagination={!(transactionList.length < 5)}
 *			 />
 *		 </CardContent>
 *	 </Card>
 *	 <Dialog
 *		 open={dialogOpen}
 *		 onClose={this.handleDialogClose}
 *		 fullWidth
 *		 maxWidth="md"
 *	 >
 *		 <TransactionView
 *			 transaction={transaction}
 *			 onClose={this.handleDialogClose}
 *		 />
 *	 </Dialog>
 *
 *
 * </React.Fragment>
 * );
 * }
 * }
 *
 * Transactions.propTypes = {
 * currentChannel: currentChannelType.isRequired,
 * getTransaction: getTransactionType.isRequired,
 * transaction: transactionType,
 * transactionList: transactionListType.isRequired
 * };
 *
 * Transactions.defaultProps = {
 * transaction: null
 * };
 *
 * export default withStyles(styles)(Transactions);
 */
