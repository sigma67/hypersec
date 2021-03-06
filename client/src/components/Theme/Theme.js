/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import indigo from '@material-ui/core/colors/indigo';
import lightBlue from '@material-ui/core/colors/lightBlue';
import red from '@material-ui/core/colors/red';
import { themeSelectors } from '../../state/redux/theme';
import '../../static/css/main.css';
import '../../static/css/main-dark.css';
import '../../static/css/media-queries.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'font-awesome/css/font-awesome.min.css';

class Theme extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  render() {
    const { mode, children } = this.props;
    return (
      <MuiThemeProvider theme={this.getTheme(mode)}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  getTheme(mode) {
    return createMuiTheme({
			overrides: {
				MuiPickersToolbar: {
					toolbar: {
						backgroundColor: '#58c5c2',
					},
				},
				MuiPickersCalendarHeader: {
					switchHeader: {
						// backgroundColor: lightBlue.A200,
						// color: "white",
					},
				},
				MuiTabs: {
					scroller: {
						backgroundColor: '#58c5c2',
					},
				},
				MuiPickersClockPointer: {
					pointer: {
						backgroundColor: '#58c5c2',
					},
					noPoint: {
						backgroundColor: '#58c5c2',
					},
					thumb: {
						backgroundColor: '#58c5c2',
						border: '14px solid #58c5c2;',
					},
				},
				MuiPickersClock: {
					pin: {
						backgroundColor: '#58c5c2',
					},
				},
				MuiPickersDay: {
					daySelected: {
						backgroundColor: '#58c5c2',
						'&:hover': {
							backgroundColor: '#419996'
						}
					},
					dayDisabled: {
						// color: lightBlue["100"],
					},
					current: {
						color: '#453e68',
					},
				},
			},
      palette: {
        contrastThreshold: 3,
        tonalOffset: 0.2,
        background: { paper: mode === 'dark' ? '#453e68' : '#ffffff' },
        primary: { ...indigo, dark: '#242036' },
        secondary: lightBlue,
        error: {
          main: red[500],
        },
        toggleClass: true,
        type: mode,
      },
    });
  }
}

const { modeSelector } = themeSelectors;

export default connect(state => ({
  mode: modeSelector(state),
}))(Theme);
