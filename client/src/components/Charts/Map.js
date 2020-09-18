import React, { useState, useEffect } from 'react';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import { IconButton, Popover } from '@material-ui/core';
import RoomIcon from '@material-ui/icons/Room';
import * as parkDate from './data/skateboard-parks.json';

export default function Map() {
	const [viewport, setViewport] = useState({
		latitude: 45.4211,
		longitude: -75.6903,
		width: '30vw',
		height: '30vh',
		zoom: 5
	});
	const [selectedPark, setSelectedPark] = useState(null);
	const [open, setOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);
	const [mapboxToken, setMapboxToken] = useState(
		'pk.eyJ1IjoiYm9laG1saW5nIiwiYSI6ImNrZWloMTd6ejBrZzEydm5wdzc1bXNxYjAifQ.c9Gl5V6GCP1CQ0lWxyVNsw'
	);

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
		<div>
			<ReactMapGL
				{...viewport}
				mapboxApiAccessToken={mapboxToken}
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
					<Popup
						latitude={selectedPark.geometry.coordinates[1]}
						longitude={selectedPark.geometry.coordinates[0]}
						onClose={() => {
							setSelectedPark(null);
						}}
					>
						<div>
							<h2>{selectedPark.properties.NAME}</h2>
							<p>{selectedPark.properties.DESCRIPTIO}</p>
						</div>
					</Popup>
				) : null}
			</ReactMapGL>
		</div>
	);
}
