/**
 *    SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import ReactTable from '../Styled/Table';
import matchSorter from 'match-sorter';
import TransactionView from '../View/TransactionView';

const getSender = (d, e) => (d.sender ? d.sender.commonName : 'NaN');

const Transactions = ({
  data,
  currentChannel,
  transactionList,
  transaction,
  getTransaction
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [directLinkDialogDoneFlag, setDirectLinkDialogDoneFlag] = useState(
    false
  );
  const [
    directLinkSearchResultsFlag,
    setDirectLinkSearchResultsFlag
  ] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [transactionId, setTransactionId] = useState('');
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
      filterAll: true,
      width: 150
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
      filterAll: true,
      width: 150
    },
    {
      Header: 'Tx Id',
      accessor: 'txhash',
      // className: classes.hash,
      Cell: row => (
        <span>
          <a
            data-command="transaction-partial-hash"
            // 	className={classes.partialHash}
            onClick={() => handleDialogOpen(row.value)}
            href="#/transactions"
          >
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
      filterAll: true,
      width: 150
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
    },
    {
      Header: 'Sender',
      id: 'sender',
      accessor: getSender,
      filterMethod: (filter, rows) =>
        matchSorter(
          rows,
          filter.value,
          { keys: ['sender'] },
          { threshold: matchSorter.rankings.SIMPLEMATCH }
        ),
      filterAll: true
    },
    {
      Header: 'Size (bytes)',
      id: 'size',
      accessor: 'size',
      filterMethod: (filter, rows) =>
        matchSorter(
          rows,
          filter.value,
          { keys: ['size'] },
          { threshold: matchSorter.rankings.SIMPLEMATCH }
        ),
      filterAll: true
    }
  ];
  const handleDialogOpen = async tid => {
    await getTransaction(currentChannel, tid);
    setDialogOpen(true);
    if (transactionId) {
      setDirectLinkDialogDoneFlag(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    if (transactionId) {
      getTransaction('ChannelNotSpecified', transactionId);
      setDirectLinkSearchResultsFlag(true);
    } else {
      let windowUrl = window.location.search;
      let queryParams = new URLSearchParams(windowUrl);
      setTransactionId(queryParams.get('transId'));
      if (queryParams.get('tab')) {
        queryParams.delete('tab');
        queryParams.delete('transId');
        window.history.pushState({}, document.title, '/#transactions');
      }
    }
    if (transaction && directLinkSearchResultsFlag) {
      let tlArray = [{}];
      tlArray[0] = transaction;
      transactionList = tlArray;
      if (!directLinkDialogDoneFlag) {
        handleDialogOpen(transactionId);
      }
    }
  });

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
};

export default Transactions;
