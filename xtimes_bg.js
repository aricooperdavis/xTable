// xtimes_bg.js
// Background script runs in the background at all times

browser.pageAction.onClicked.addListener(iconClicked);

function iconClicked(tab) {
	// Get iPuz from content script
	let iPuzPromise = browser.tabs.sendMessage(
			tab.id,
			{action: "click"}
		).then( response => {
		// Convert to iPuz format
		ipuz = _to_ipuz(response.data);

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
	});
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
				enumeration: data.copy.clues[i].clues[clue].format
			});
		}
	}

	return ipuz;
}
