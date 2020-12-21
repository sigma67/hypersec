/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Card, CardBody, CardTitle } from 'reactstrap';
import Modal from '../Styled/Modal';

export class ChaincodeScanModal extends Component {
	handleClose = () => {
		const { onClose } = this.props;
		onClose();
	};

	render() {
		const { scan } = this.props;

			return (
				<Modal>
					{modalClasses => (
						<div className={modalClasses.dialog}>
							<Card className={modalClasses.card}>
								<CardTitle className={modalClasses.title}>
									<FontAwesome name="shield" />
									 Security Scan Result
									<button
										type="button"
										onClick={this.handleClose}
										className={modalClasses.closeBtn}
									>
										<FontAwesome name="close" />
									</button>
								</CardTitle>
								<CardBody className={modalClasses.body}>
								 <p>
										{ scan }
									</p>
								</CardBody>
							</Card>
						</div>
					)}
				</Modal>
			);
		}
}

ChaincodeScanModal.defaultProps = {
	logs: null
};

export default ChaincodeScanModal;
