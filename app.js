const urllib = require('urllib');
const fs = require('fs');
const storage = require('electron-json-storage');

var addTvShowButton = document.getElementById('add-to-library-btn');
var deleteButton = document.getElementById('delete-show-btn');
var searchTextField = document.getElementById('search-field');
var rootURL = 'http://api.tvmaze.com'

/** globals */
var CURRENT_SESSION_TV_SHOWS = [];

/** initially displays all the shows from JSON file */
loadTvShowsFromStorage();

/** Button actions */
addTvShowButton.onclick = function() {
  var tvShow = document.getElementById('search-field').value;
  addTvShowToLibrary(tvShow);
  searchTextField.value='';
}

deleteButton.onclick = function() {
  var tvShowName = document.getElementById('search-field').value;
  deleteTvShowFromLibrary(tvShowName);
  loadTvShowsFromStorage();
  searchTextField.value='';
}

function addTvShowToLibrary(tvShow){
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
    CURRENT_SESSION_TV_SHOWS.push(show);
    addTvShowToScreen(show)
    console.log(CURRENT_SESSION_TV_SHOWS);

    storage.set(info['name'], show, function(error) {
      if (error) console.log("error");
    });


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

/** Deletes all the shows from the library. */
function deleteAllShowsFromLibrary() {
  storage.clear(function(error) {
    if (error) throw error;
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
function loadTvShowsFromStorage() {
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
        tr.setAttribute('id', data['name'].toLowerCase());
        var tdName = document.createElement('td');
        var tdSummary = document.createElement('td');
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
 * @param {object} show - show object
 */
function addTvShowToScreen(tvShow) {
  var tbody = document.getElementById('tv-show-table-body')
  var tr = document.createElement('tr');
  tr.setAttribute('id', tvShow['name'].toLowerCase());
  var tdName = document.createElement('td');
  var tdSummary = document.createElement('td');
  tdName.appendChild(document.createTextNode(tvShow['name']));
  tdSummary.appendChild(document.createTextNode(tvShow['summary']));
  tr.appendChild(tdName);
  tr.appendChild(tdSummary);
  tbody.appendChild(tr);
}

/**
 * Remove a tr item from the table corresponding to deleted show
 * @param {string} tvShowName - tv show name
*/
function deleteTvShowFromLibrary(tvShowName) {
  tvShowName.toLowerCase();
  // delete from current session
  for(var i = 0; i < CURRENT_SESSION_TV_SHOWS.length; i++) {
    if (tvShowName === CURRENT_SESSION_TV_SHOWS[i]['name']) {
      CURRENT_SESSION_TV_SHOWS.splice(i, 1);
    }
  }

  // delete from save file
  storage.remove(tvShowName, function(error) {
    if (error) throw error;
  });
}

function deleteTvShowFromScreen(tvShowName) {
  tvShowName.toLowerCase();
  var row = document.getElementById(tvShowName);
  row.parentNode.removeChild(row);
}
