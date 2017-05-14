var userName, yearAgo, token;
// initialize result array
var contributions = new Array(365);
for (var i = 0; i < contributions.length; i++) {
	contributions[i] = new Array(3).fill(0);
}

/**
 * worker thread's handler for parameters passed by main thread
 * @param  {event} e 
 * @return {[type]}   [description]
 */
onmessage = function(e) {
	userName = e.data[2];
	yearAgo = e.data[3];
	token = e.data[4];

	queryIssues(e.data[0], e.data[1]);
	queryCommits(e.data[0], e.data[1]);

	postMessage(contributions);
}

/**
 * Query API for the issues opened by the user in a given repo
 * @param  {string} owner owner of a repo
 * @param  {string} repo  
 * @return {[type]}       [description]
 */
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

/**
 * Calculate an issue's date difference from 365 days ago. Increment the coresponding array element.
 * @param  {string} responseText response received from API
 * @return {[type]}              [description]
 */
function parseIssues(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var issue = response[i];
		var date = new Date(issue.created_at);
		var index = Math.floor((date - yearAgo) / (1000 * 60 * 60 * 24)) - 1;
		if (index >= 0) {
			// if the issue is a pull request.
			if (issue.hasOwnProperty('pull_request')) {
				contributions[index][2]++;
			} else {
				contributions[index][0]++;
			}
		}
	}
}

/**
 * Query API for the commits made by the user in a given repo
 * @param  {string} owner owner of a repo
 * @param  {string} repo  
 * @return {[type]}       [description]
 */
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

/**
 * Calculate a commit's date difference from 365 days ago, and increment the corresponding array element.
 * @param  {string} responseText response received from API
 * @return {[type]}              [description]
 */
function parseCommits(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var commit = response[i];
		var date = new Date(commit.commit.author.date);
		var index = Math.floor((date - yearAgo) / (1000 * 60 * 60 * 24)) - 1;
		if (index >= 0) {
			contributions[index][1]++;
		}
	}
}
