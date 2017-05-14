var queryButton = document.getElementById('query-button');
var userName;
var token = 'cc0d862337b750050b5711afaba9110cd5e4c7a4';
var contributions = new Array(365).fill(0);
var yearAgo = new Date();
yearAgo.setDate(yearAgo.getDate() - 365);

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

	request.open('GET', 'https://api.github.com/users/' + userName + '/repos');
	// request.open('GET', 'https://api.github.com/repos/cit-upenn/cit-591-projects-fall-2016-happy_hour_go/pulls?state=all');
	// request.open('GET', 'https://api.github.com/repos/cit-upenn/cit-591-projects-fall-2016-happy_hour_go/commits?author=zhuhan0');
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
};

function parseRepos(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var repo = response[i];
		if (!repo.fork) {
			console.log(repo.name);
			queryIssues(repo.owner.login, repo.name);
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

	request.open('GET', 'https://api.github.com/repos/' + owner + '/' + repo + '/issues?creator=' + userName + '&state=all');
	request.setRequestHeader('Authorization', 'token ' + token);
	request.send();
}

function parseIssues(responseText) {
	var response = JSON.parse(responseText);
	for (var i = 0; i < response.length; i++) {
		var issue = response[i];
		var date = new Date(issue.created_at);
		if (date >= yearAgo) {
			var index = Math.floor((date - yearAgo) / (1000 * 60 * 60 * 24));
			contributions[index]++;
			console.log(issue);
		}
	}
}

