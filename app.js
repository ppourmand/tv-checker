const urllib = require('urllib');
const fs = require('fs');
const storage = require('electron-json-storage');

var searchButton = document.getElementById('add-to-library-btn');
var printButton = document.getElementById('print-library-btn');
var deleteButton = document.getElementById('delete-show-btn');
var searchTextField = document.getElementById('search-field');
var rootURL = 'http://api.tvmaze.com'

/** initially displays all the shows from JSON file */
displayShowsOnScreen();

/** Button actions */
searchButton.onclick = function() {
  var tvShow = document.getElementById('search-field').value;
  addShowToLibrary(tvShow);
  searchTextField.value='';
}

printButton.onclick = function() {
  displayShowsOnScreen();
}

deleteButton.onclick = function() {
  var tvShow = document.getElementById('search-field').value;
  deleteShowFromLibrary(tvShow);
  displayShowsOnScreen();
  searchTextField.value='';
}

function addShowToLibrary(tvShow){
  urllib.request(rootURL + '/search/shows?q=' + tvShow, function (err, data, res) {
    if (err) {
      console.log("errors!!!")
    }
    if (res.statusCode === 404){
      console.log("No show with that name found")
    }
    var info = JSON.parse(data);
    info = info[0]['show'];

    var show = new TelevisionShow(info['name'], info['id'], info['summary'], ['a', 'b', 'c']);

    storage.set(info['name'], show, function(error) {
      if (error) console.log("error");
    });

    addShowToScreen(show);
  });
}

function getEpisodeListById(id) {
  var episodes = [];
  urllib.request(rootURL + '/shows/' + id +'/episodes', function (err, data, res) {
    if (err) {
     console.log("errors!!!")
    }
    if (res.statusCode === 404){
     console.log("No show with that name found")
    }
    var info = JSON.parse(data);

    for(var i = 0; i < info.length; i++) {
     var ep = new Episode(info[i]['name'],
                          info[i]['season'],
                          info[i]['number'],
                          info[i]['airdate'],
                          info[i]['summary']);
     episodes.push(ep);
    }
  });

  return episodes;
}

/** Deletes specific TV show from the library. */
function deleteShowFromLibrary(showName) {
  storage.remove(showName, function(error) {
    if (error) throw error;
  });
}

/** Deletes all the shows from the library. */
function deleteAllShowsFromLibrary() {
  storage.clear(function(error) {
    if (error) throw error;
  });
}

/** Prints all the shows from the library to stdout. */
function printShowsFromLibrary() {
  storage.keys(function(error, keys) {
    if (error) throw error;

    for (var key of keys) {
      key = key.replace(/%20/g, " ");
      storage.get(key, function(error, data) {
        if (error) throw error;

        console.log(data);
      });
    }
  });
}

/**
 * Represents a tv show
 * @constructor
 * @param {string} name - Name of the TV show
 * @param {string} id - Unique ID obtained from API for the TV show
 * @param {string} summary - Summary obtained from API call
 * @param {Array} episodes - An Array of episode objects
 */
function TelevisionShow(name, id, summary, episodes) {
  this.name = name;
  this.id = id;
  this.summary = summary;
  this.episodes = episodes;

  this.printTelevisionShowAttributes = function() {
    console.log(this.name);
    console.log(this.id);
    console.log(this.summary);
    // console.log(this.episodes);
  }
}

/**
 * Represents an episode
 * @constructor
 * @param {string} name - Name of the episode
 * @param {string} season - Season of the episode
 * @param {string} number - Episode number
 * @param {string} airdate - Date episode first aired
 * @param {string} summary - Summary of episode
 */
function Episode(name, season, number, airdate, summary) {
  this.name = name;
  this.season = season;
  this.number = number;
  this.airdate = airdate;
  this.summary = summary;
}

/**
 * Creates new tbody to replace old one so we can display
 * all the info from the JSON file
 */
function displayShowsOnScreen() {
  var oldTbody = document.getElementById('tv-show-table-body')
  var newTbody = document.createElement('tbody')
  var table = document.getElementById('tv-show-table');
  newTbody.setAttribute('id', 'tv-show-table-body');

  storage.keys(function(error, keys) {
    if (error) throw error;

    for (var key of keys) {
      key = key.replace(/%20/g, " ");
      storage.get(key, function(error, data) {
        if (error) throw error;

        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        var tdSummary = document.createElement('td');
        var cleanSummary = data['summary'].replace('</p>', '');
        tdName.appendChild(document.createTextNode(data['name']));
        tdSummary.appendChild(document.createTextNode(data['summary']));
        tr.appendChild(tdName);
        tr.appendChild(tdSummary);
        newTbody.appendChild(tr);
      });
    }
  });

  oldTbody.parentNode.replaceChild(newTbody, oldTbody);
}

/**
 * Append a tr item to the end of the table on main screen
 * @constructor
 * @param {object} show - show object
 */
function addShowToScreen(show) {
  var tbody = document.getElementById('tv-show-table-body')
  var tr = document.createElement('tr');
  var tdName = document.createElement('td');
  var tdSummary = document.createElement('td');
  tdName.appendChild(document.createTextNode(show['name']));
  tdSummary.appendChild(document.createTextNode(show['summary']));
  tr.appendChild(tdName);
  tr.appendChild(tdSummary);
  tbody.appendChild(tr);

}
