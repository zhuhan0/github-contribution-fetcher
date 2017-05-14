var queryButton = document.getElementById('query-button');
var userName;
var token = '';
// initialize the result array
var contributions = new Array(365);
for (var i = 0; i < contributions.length; i++) {
	contributions[i] = new Array(3).fill(0);
}
var yearAgo = new Date();
yearAgo.setDate(yearAgo.getDate() - 365);
// used for multithreading
var counter = 0;

/**
 * Get the username from html form and query API for the user's repos.
 * @param  {event} e 
 * @return {[type]}   [description]
 */
queryButton.onclick = function(e) {
	e.preventDefault();

	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				parseRepos(request.response);
			} else {
				console.error('Error querying repos: ', request.status);
			}
		}
	}

	var queryForm = document.getElementById('query-form');
	userName = queryForm.elements[0].value;

	request.open('GET', 'https://api.github.com/users/' + userName + '/repos?type=all');
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
}

/**
 * Pass a repo's information to a web worker to get issues, commits, and pull requests. Each worker handles one repo.
 * @param  {string} responseText JSON string received from GitHub
 * @return {[type]}              [description]
 */
function parseRepos(responseText) {
	var response = JSON.parse(responseText);
	var responseLen = response.length;
	for (var i = 0; i < response.length; i++) {
		var repo = response[i];
		// events in a forked repo is not a contribution
		if (!repo.fork) {
			var worker = new Worker('worker.js');
			worker.postMessage([repo.owner.login, repo.name, userName, yearAgo, token]);

			/**
			 * main thread's handler for a worker's result
			 * @param  {array} e a 365 * 3 matrix which contains the contributions calculated by this worker
			 * @return {[type]}   [description]
			 */
			worker.onmessage = function(e) {
				for (var i = 0; i < contributions.length; i++) {
					for (var j = 0; j < contributions[0].length; j++) {
						contributions[i][j] += parseInt(e.data[i][j]);
					}
				}
				
				// wait for all workers to finish
				counter++;
				if (counter == responseLen) {
					displayContributions();
				}
			}
		} else {
			responseLen--;
		}
	}

}

/**
 * Display result in a table
 * @return {[type]} [description]
 */
function displayContributions() {
	var resultDiv = document.getElementById('result-div');
	var table = document.createElement('table');
	table.classList.add('table');
	createHeader(table);
	
	var body = document.createElement('tbody');
	var date = new Date();
	for (var i = 364; i >= 0; i--) {
		var row = document.createElement('tr');
		var cell0 = document.createElement('td');
		date = new Date(date);
		cell0.innerHTML = date.toDateString();
		date -= 1000 * 60 * 60 * 24;
		row.appendChild(cell0);

		for (var j = 0; j < 4; j++) {
			var cell = document.createElement('td');
			var value;
			// total column
			if (j === 3) {
				value = contributions[i][0] + contributions[i][1] + contributions[i][2];
			} else {
				value = contributions[i][j];
			}

			// make actual contributions bold
			if (value > 0) {
				var bold = document.createElement('b');
				var text = document.createTextNode(value.toString());
				bold.appendChild(text);
				cell.appendChild(bold);
			} else {
				cell.innerHTML = value;
			}
			row.appendChild(cell);
		}

		body.appendChild(row);
	}

	table.appendChild(body);
	resultDiv.appendChild(table);
}

/**
 * Create header for the result table
 * @param  {HTML table} table 
 * @return {[type]}       [description]
 */
function createHeader(table) {
	var header = document.createElement('thead');
	var row = document.createElement('tr');
	var headerCells = [];

	for (var i = 0; i < 5; i++) {
		headerCells[i] = document.createElement('th');
	}

	headerCells[0].innerHTML = 'Date';
	headerCells[1].innerHTML = 'Issues';
	headerCells[2].innerHTML = 'Commits';
	headerCells[3].innerHTML = 'Pull Requests';
	headerCells[4].innerHTML = 'Total';

	for (var i = 0; i < 5; i++) {
		row.appendChild(headerCells[i]);
	}

	header.appendChild(row);
	table.appendChild(header);
}
