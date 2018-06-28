const fetch = require("node-fetch");
const parse = require('csv-parse');
const fs = require('fs');

const fetchStations = () => {
  return fetch('http://web.mta.info/developers/data/nyct/subway/Stations.csv')
    .then(response => response.text())
    .then(text => {
      return new Promise((resolve, reject) => {
        parse(text, {columns: true}, function(err, stations) {
          if (err) throw err;
          resolve(stations);
        });
      });
    });
}

const fetchComplexes = () => {
  return fetch('http://web.mta.info/developers/data/nyct/subway/StationComplexes.csv')
    .then(response => response.text())
    .then(text => {
      return new Promise((resolve, reject) => {
        parse(text, {columns: true}, function(err, complexes) {
          if (err) throw err;
          resolve(complexes);
        });
      });
    });
}

const extraComplexBoroughs = {
  601: "M",
  602: "M",
  603: "Bx",
  604: "Bx",
  605: "M",
  606: "Q",
  607: "M",
  608: "Bk",
  609: "M",
  610: "M",
  611: "M",
  612: "M",
  613: "M",
  614: "M",
  615: "Bk",
  616: "Q",
  617: "Bk",
  618: "M",
  619: "M",
  620: "Bk",
  621: "Bk",
  622: "M",
  623: "M",
  624: "M",
  625: "M",
  626: "Bk",
  627: "Bk",
  628: "Bk",
  629: "Bk",
  630: "Bk",
  635: "M",
  636: "Bk",
}

const buildJSON = () => {
  return Promise.all(
    [
      fetchStations(),
      fetchComplexes()
    ]
  ).then(([stations, complexes]) => {
    const json = {};
    complexes.forEach(complex => {
      const id = complex['Complex ID'];
      const name = complex['Complex Name'];
      json[id] = {
        id,
        name,
        daytimeRoutes: [],
        borough: extraComplexBoroughs[id]
      };
    });
    stations.forEach(station => {
      const id = station['Complex ID'];
      const name = station['Stop Name'];
      let complex = {};
      if (json[id]) {
        complex = json[id];
      } else {
        complex = {
          id,
          name,
          daytimeRoutes: []
        };
      }
      complex.borough = station['Borough'];
      complex.latitude = station['GTFS Latitude'];
      complex.longitude = station['GTFS Longitude'];
      complex.daytimeRoutes = complex.daytimeRoutes.concat(station['Daytime Routes'].split(' '));
      json[id] = complex;
    });
    return json;
  });
}

buildJSON()
  .then(complexes => {
    fs.writeFile('complexes.json', JSON.stringify(complexes, null, 2), (err) => {
      if (err) {
        throw err;
      }
      console.log(`Complete.`);
    });
  })