/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Card, CardBody, CardTitle } from 'reactstrap';
import Modal from '../Styled/Modal';
import ReactTable from "../Styled/Table";
import moment from 'moment';

export class LogView extends Component {
	handleClose = () => {
		const { onClose } = this.props;
		onClose();
	};

	render() {
		const { logs } = this.props;

		const columnHeaders = [
			{
				Header: 'Level',
				width: 50,
				accessor: 'level'
			},
			{
				id: 'ts',
				Header: 'Time',
				width: 150,
				accessor: d => moment.unix(d.ts).format("MM-DD HH:mm:ss")
			},
			{
				Header: 'Source',
				accessor: 'name',
				width: 200,
				Cell: props => (
					<div>
						<span title={props.original.caller}>{props.original.name}</span>
					</div>
				),
			},
			{
				Header: 'Message',
				accessor: 'msg',
				Cell: row => (
					<div>
						<span title={row.value}>{row.value}</span>
					</div>
				),
			}
		];

		if (logs) {
			return (
				<Modal>
					{modalClasses => (
						<div className={modalClasses.dialog}>
							<Card className={modalClasses.card}>
								<CardTitle className={modalClasses.title}>
									<FontAwesome name="list-alt" />
									Log Entries
									<button
										type="button"
										onClick={this.handleClose}
										className={modalClasses.closeBtn}
									>
										<FontAwesome name="close" />
									</button>
								</CardTitle>
								<CardBody className={modalClasses.body}>
									<ReactTable
										data={logs.reverse()}
										columns={columnHeaders}
										defaultPageSize={10}
										list
										filterable
										minRows={0}
										style={{ height: '400' }}
										width={undefined}
										minWidth={10}
										showPagination={!(logs.length < 5)}
									/>
								</CardBody>
							</Card>
						</div>
					)}
				</Modal>
			);
		}
		return (
			<Modal>
				{modalClasses => (
					<div>
						<CardTitle className={modalClasses.title}>
							<FontAwesome name="list-alt"/>
							Log Details
							<button
								type="button"
								onClick={this.handleClose}
								className={modalClasses.closeBtn}
							>
								<FontAwesome name="close" />
							</button>
						</CardTitle>
						<div align="center">
							<CardBody className={modalClasses.body}>
								<span>
									{' '}
									<FontAwesome name="circle-o-notch" size="3x" spin />
								</span>
							</CardBody>
						</div>
					</div>
				)}
			</Modal>
		);
	}
}

LogView.defaultProps = {
	logs: null
};

export default LogView;
