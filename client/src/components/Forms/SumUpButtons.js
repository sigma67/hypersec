import React from 'react';
import { Button } from 'semantic-ui-react';
import './Button.css';

const ButtonGroupVertical = () => (
	<div>
		<Button.Group vertical>
			<Button basic color="blue">
				Blocks
			</Button>
			<Button basic color="blue">
				Blocks
			</Button>
		</Button.Group>
	</div>
);

export default ButtonGroupVertical;
