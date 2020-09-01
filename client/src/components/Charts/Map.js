import React, { useState, useEffect } from 'react';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import { IconButton, Popover } from '@material-ui/core';
import RoomIcon from '@material-ui/icons/Room';
import * as parkDate from './data/skateboard-parks.json';

export default function Map() {
	const [viewport, setViewport] = useState({
		latitude: 45.4211,
		longitude: -75.6903,
		width: '100vw',
		height: '100vh',
		zoom: 10
	});
	const [selectedPark, setSelectedPark] = useState(null);
	const [open, setOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);

	useEffect(() => {
		const listener = e => {
			if (e.key === 'Escape') {
				setOpen(false);
				setSelectedPark(null);
				setAnchorEl(null);
			}
		};
		window.addEventListener('keydown', listener);

		return () => {
			window.removeEventListener('keydown', listener);
		};
	}, []);

	return (
		<ReactMapGL
			{...viewport}
			mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
			mapStyle="mapbox://styles/mapbox/outdoors-v11"
			onViewportChange={viewport => {
				setViewport(viewport);
			}}
		>
			{parkDate.features.map(park => (
				<Marker
					key={park.properties.PARK_ID}
					latitude={park.geometry.coordinates[1]}
					longitude={park.geometry.coordinates[0]}
				>
					<IconButton
						color="primary"
						onClick={e => {
							e.preventDefault();
							setSelectedPark(park);
							setOpen(true);
							setAnchorEl(e.currentTarget);
						}}
					>
						<RoomIcon></RoomIcon>
						{/* Skate Park Icon<img src="/skateboarding.svg" alt="Skate Park Icon" /> */}
					</IconButton>
				</Marker>
			))}

			{selectedPark ? (
				<Popover
					open={open}
					anchorOrigin={{
						vertical: 'top',
						horizontal: 'left'
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'left'
					}}
					anchorEl={anchorEl}
					/* latitude={selectedPark.geometry.coordinates[1]}
						longitude={selectedPark.geometry.coordinates[0]} */
					onClose={() => {
						setSelectedPark(null);
						setOpen(false);
						setAnchorEl(null);
					}}
				>
					<div>
						<h2>{selectedPark.properties.NAME}</h2>
						<p>{selectedPark.properties.DESCRIPTIO}</p>
					</div>
				</Popover>
			) : null}
		</ReactMapGL>
	);
}
