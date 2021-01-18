// xtimes_bg.js
// Background script runs in the background of matched pages

// Set global variable for response
var response = '';

// Enable/disable the icon
browser.tabs.onUpdated.addListener(
	testEligibility
);

function testEligibility(_, _, c) {
	if ( c.url.match( /https:\/\/www.thetimes.co.uk\/puzzle.*\d+/ ) ) {
		browser.browserAction.enable();
	} else {
		browser.browserAction.disable();
	}
}

// Listen for icon click
browser.browserAction.onClicked.addListener(
	iconClicked
);

function iconClicked() {
	// Download json
	let ipuz = _to_ipuz(JSON.parse(response).data);

	// Process for download
	let ipuz_blob = new Blob(
		[JSON.stringify(ipuz)],
		{type: "text/json;charset=utf-8"}
	);
	let ipuz_url = URL.createObjectURL(ipuz_blob);

	// Download result
	browser.downloads.download({
		filename: ipuz.title+'.json',
		url: ipuz_url,
	});
}

// Get data from context script if puzzle in iframe
browser.runtime.onMessage.addListener(fetchPuzzle);

function fetchPuzzle(message) {
  response = JSON.stringify(message);
}

// Listen for requests of the crossword data array
browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["*://feeds.thetimes.co.uk/puzzles/crossword/*/data.json"]},
	["blocking"]
);

function listener(details) {

	// Create an empty variable to store the response data
	let decoder = new TextDecoder("utf-8");
	let filter = browser.webRequest.filterResponseData(details.requestId);

	// Clear the response variable if a new response is coming in
	filter.onstart = event => {
		response = '';
	}

	// When a data chunk is receieved add it to the end of the data string
	filter.ondata = event => {
		let str = decoder.decode(event.data, {stream: true});
		response += str;
		filter.write(event.data);
	}

	// When the response is complete then close the filter
	filter.onstop = event => {
		filter.close();
	}

}

/* Helper functions */
function _to_ipuz(data) {

	// Set common puzzle fields
	let ipuz = {
		version: "http://ipuz.org/v2",
		kind: ["http://ipuz.org/crossword/crypticcrossword#1"],
		publisher: data.copy.publisher,
		uniqueid: data.copy.id,
		title: data.copy.title,
		explanation: data.copy.correctsolutionmessagetext,
		author: data.copy.setter,
		date: data.created,
		origin: "Scraped from TheTimes.co.uk by xTimes Firefox Extension",
		dimensions: {
			width: data.grid[0].length,
			height: data.grid.length,
		},
		puzzle: [], // To be populated later
		solution: [], // To be populated later
		clues: {
			Across: [],
			Down: [],
		}, // To be populated later
	};

	// Parse grid definition
	for (let row in data.grid) {
		let puzz_row = [];
		let soln_row = [];
		for ( let column in data.grid[row] ) {
			if ( data.grid[row][column].Blank == "blank" ) {
				puzz_row.push("#");
				soln_row.push('#');
			} else {
				puzz_row.push(data.grid[row][column].Number);
				soln_row.push(data.grid[row][column].Letter);
			}
		}
		ipuz.puzzle.push(puzz_row);
		ipuz.solution.push(soln_row);
	}

	// Parse solution definition
	for ( let i in data.copy.clues ) {
		for ( let clue in data.copy.clues[i].clues ) {
			ipuz.clues[data.copy.clues[i].title].push({
				number: parseInt(data.copy.clues[i].clues[clue].number),
				clue: data.copy.clues[i].clues[clue].clue,
				enumeration: parseInt(data.copy.clues[i].clues[clue].length)
			});
		}
	}

	return ipuz;
}
