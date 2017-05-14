var queryButton = document.getElementById('query-button');
var userName;
var token = '';
var contributions = new Array(365);
for (var i = 0; i < contributions.length; i++) {
	contributions[i] = new Array(3).fill(0);
}
var yearAgo = new Date();
yearAgo.setDate(yearAgo.getDate() - 365);

queryButton.onclick = function(e) {
	e.preventDefault();

	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				parseRepos(request.response);
				displayContributions();
			} else {
				console.error('Error querying repos: ', request.status);
			}
		}
	}

	var queryForm = document.getElementById('query-form');
	userName = queryForm.elements[0].value;

	request.open('GET', 'https://api.github.com/users/' + userName + '/repos?type=all');
	// request.open('GET', 'https://api.github.com/repos/cit-upenn/cit-591-projects-fall-2016-happy_hour_go/pulls?state=all');
	// request.open('GET', 'https://api.github.com/repos/cit-upenn/cit-591-projects-fall-2016-happy_hour_go/commits?author=zhuhan0');
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
}

function parseRepos(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var repo = response[i];
		if (!repo.fork) {
			queryIssues(repo.owner.login, repo.name);
			queryCommits(repo.owner.login, repo.name);
		}
	}
}

function queryIssues(owner, repo) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				parseIssues(request.response);
			} else {
				console.error("Error querying issues: ", request.status);
			}
		}
	}

	request.open('GET', 'https://api.github.com/repos/' + owner + '/' + repo + '/issues?creator=' + userName + '&since=' + yearAgo.toISOString() + '&state=all', false);
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
}

function parseIssues(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var issue = response[i];
		var date = new Date(issue.created_at);
		var index = Math.floor((date - yearAgo) / (1000 * 60 * 60 * 24));
		if (index >= 0) {
			if (issue.hasOwnProperty('pull_request')) {
				contributions[index][2]++;
			} else {
				contributions[index][0]++;
			}
		}
	}
}

function queryCommits(owner, repo) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				parseCommits(request.response);
			} else {
				console.error("Error querying commits: ", request.status);
			}
		}
	}

	request.open('GET', 'https://api.github.com/repos/' + owner + '/' + repo + '/commits?author=' + userName + '&since=' + yearAgo.toISOString(), false);
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
}

function parseCommits(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var commit = response[i];
		var date = new Date(commit.commit.author.date);
		var index = Math.floor((date - yearAgo) / (1000 * 60 * 60 * 24));
		if (index >= 0) {
			contributions[index][1]++;
		}
	}
}

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
			if (j === 3) {
				cell.innerHTML = contributions[i][0] + contributions[i][1] + contributions[i][2];
			} else {
				cell.innerHTML = contributions[i][j];
			}
			row.appendChild(cell);
		}

		body.appendChild(row);
	}

	table.appendChild(body);
	resultDiv.appendChild(table);
}

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
