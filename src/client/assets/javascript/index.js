// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	selectedTrack: null,
	selectedPlayer: null,
	selectedRace: null,
	tracks: [],
	racers: []
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
				store = {
					...store,
					tracks: tracks
				};
				// console.log(store);
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
				store = {
					...store,
					racers: racers
				};
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)	
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {

	const {
		selectedPlayer,
		selectedTrack,
		tracks,
		racers
	} = store;
	
	const trackData = tracks.filter(t => t.id === parseInt(selectedTrack))[0];
	const playerData = racers.filter(p => p.id === parseInt(selectedPlayer))[0];

	// render starting UI
	renderAt('#race', renderRaceStartView(trackData, playerData));
	const race = await createRace(selectedPlayer, selectedTrack);

	store = {
		...store,
		selectedRace: race.ID - 1,
		positions: race.result
	};
	
	await runCountdown();

	await startRace(store.selectedRace);

	await runRace(store.selectedRace);
}

function runRace(raceID) {
	return new Promise((resolve,reject) => {
		const showRace = (status) => {
			return () => {
				getRace(raceID)
				.then(res => {
					status = res.status;
					if(status === 'in-progress') {
						renderAt('#leaderBoard', raceProgress(res.positions));
					} else if(status === 'finished') {
						clearInterval(raceInterval);
						renderAt('#race', resultsView(res.positions));
						resolve(res);
					} 
				})
				.catch(err => reject(err));
			}
		};

		const raceInterval = setInterval(showRace('unstarted'), 500);
	});
}

async function runCountdown() {
	try {
		return new Promise(resolve => {
			function timerCountdown(timer) {
				return () => {
					document.getElementById('big-numbers').innerHTML = timer;
					if(timer === 0) {
						clearInterval(countDown);
						resolve();
					} else {
						timer--;
					}
				}
			}

			const countDown = setInterval((countDownCb) => {
					countDownCb();
			}, 1000, timerCountdown(3));
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	let racer = target.id.replace('racer-', '')

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	//save the selected racer to the store
	store = {
		...store,
		selectedPlayer: racer
	}
}

function handleSelectTrack(target) {
	let track = target.id.replace('track-', '');

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	//save the selected track id to the store
	store = {
		...store,
		selectedTrack: track
	}
}

async function handleAccelerate() {
	console.log("accelerate button clicked")
	console.log('accelerating player:', store.selectedRace);
	await accelerate(store.selectedRace);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	console.log(racers);
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="racer-${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="track-${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {

	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.selectedPlayer))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`, {
		method: 'GET',
		...defaultFetchOpts(),
	})
	.then(res => res.json())
	.catch(err => err.console.log("Problem with getting tracks::", err));
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`, {
		method: 'GET',
		...defaultFetchOpts(),
	})
	.then(res => res.json())
	.catch(err => err.console.log("Problem with getting cars::", err));
}

function createRace(player_id, track_id) {

	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`, {
		method: 'GET',
		...defaultFetchOpts
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with getting race information::", err));
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => res)
	.catch(err => console.log("Problem with getRace request::", err))
}

function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => res)
	.catch(err => console.log("Problem with getRace request::", err))
}
