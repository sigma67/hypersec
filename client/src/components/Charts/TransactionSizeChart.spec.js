/**
 *    SPDX-License-Identifier: Apache-2.0
 */
import Enzyme, { shallow, mount } from 'enzyme';
import { unwrap } from '@material-ui/core/test-utils';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Adapter from 'enzyme-adapter-react-16';
import { createMuiTheme } from '@material-ui/core/styles';
import { TransactionSizeChart } from './TransactionSizeChart';

Enzyme.configure({ adapter: new Adapter() });

const ComponentNaked = unwrap(TransactionSizeChart);

jest.useFakeTimers();

const setup = () => {
	const props = {
		classes: {
			chart: 'chart'
		},
		transactionSize: [
			{ datetime: '2018-05-13T17:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T18:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T19:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T20:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T21:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T22:00:00.000Z', count: '0' },
			{ datetime: '2018-05-13T23:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T00:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T01:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T02:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T03:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T04:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T05:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T06:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T07:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T08:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T09:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T10:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T11:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T12:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T13:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T14:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T15:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T16:00:00.000Z', count: '0' },
			{ datetime: '2018-05-14T17:00:00.000Z', count: '0' }
		],
		getTransactionSize: jest.fn(),
		currentChannel: 'mychannel'
	};

	const wrapper = shallow(<TransactionSizeChart {...props} />);

	return {
		props,
		wrapper
	};
};

describe('TransactionSizeChart', () => {
	test('TransactionSizeChart component should render', () => {
		const { wrapper } = setup();
		expect(wrapper.exists()).toBe(true);
	});

	test('setInterval called', () => {
		const { props } = setup();
		const { getTransactionSize } = props;
		expect(setInterval).toHaveBeenCalled();
		jest.runOnlyPendingTimers();
		expect(getTransactionSize).toHaveBeenCalled();
		expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 60000);
	});

	test('Nav tabs toggle to the corresponding state', () => {
		const { wrapper } = setup();
		expect(wrapper.state('activeTab')).toBe('1');
		wrapper
			.find('NavLink')
			.findWhere(n => n.contains('TX SIZE'))
			.first()
			.simulate('click');
	});

	test('timeDataSetup returns new dataMax', () => {
		const { wrapper } = setup();
		const data = [{ datetime: '2018-05-13T17:00:00.000Z', count: '10' }];
		expect(wrapper.instance().timeDataSetup(data).dataMax).toBe(15);
	});

	test('timeDataSetup returns same dataMax', () => {
		const { wrapper } = setup();
		const data = [{ datetime: '2018-05-13T17:00:00.000Z', count: '0' }];
		expect(wrapper.instance().timeDataSetup(data).dataMax).toBe(5);
	});

	test('calls componentDidMount', () => {
		jest.spyOn(TransactionSizeChart.prototype, 'componentDidMount');
		expect(
			TransactionSizeChart.prototype.componentDidMount.mock.calls.length
		).toBe(0);
	});

	test('Onclick on the 1st tabs button should call toggle() function', () => {
		const { wrapper } = setup();
		const toggle = jest.spyOn(wrapper.instance(), 'toggle');
		wrapper
			.find('NavLink')
			.at(0)
			.simulate('click');
		expect(toggle).toHaveBeenCalled();
		wrapper.update();
	});

	test('Onclick on the 2nd tab button should call toggle() function', () => {
		const { wrapper } = setup();
		const toggle = jest.spyOn(wrapper.instance(), 'toggle');
		wrapper
			.find('NavLink')
			.at(1)
			.simulate('click');
		expect(toggle).toHaveBeenCalled();
		wrapper.update();
	});

	test('Onclick on the 3rd tab button should call toggle() function', () => {
		const { wrapper } = setup();
		const toggle = jest.spyOn(wrapper.instance(), 'toggle');
		wrapper
			.find('NavLink')
			.at(2)
			.simulate('click');
		expect(toggle).toHaveBeenCalled();
		wrapper.update();
	});

	test('syncData calls the selectors', () => {
		const { wrapper, props } = setup();
		const { getTransactionSize } = props;
		wrapper.instance().syncData('newData');
		expect(getTransactionSize).toHaveBeenCalled();
	});
});

describe('<TransactionSizeChart />', () => {
	it('with shallow', () => {
		const wrapperone = shallow(<ComponentNaked classes={{}} />);
		expect(wrapperone.exists()).toBe(true);
	});

	it('with mount', () => {
		const wrapperone = mount(
			<MuiThemeProvider theme={createMuiTheme()}>
				<TransactionSizeChart classes={{}} />
			</MuiThemeProvider>
		);
		expect(wrapperone.exists()).toBe(true);
	});

	it('Check if dark theme is applied correctly', () => {
		const wrapperone = mount(
			<MuiThemeProvider theme={createMuiTheme({ palette: { type: 'dark' } })}>
				<TransactionSizeChart classes={{}} />
			</MuiThemeProvider>
		);
		expect(wrapperone.exists()).toBe(true);
	});
});
