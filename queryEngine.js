'use strict';

let runQuery = require('./sql').runQuery;
let runQueryCached = require('./sqlCached').runQuery;
let mapAsync = require('map-async');
let glob = require('glob');
let queryProviders = glob.sync('queryProviders/*.js').map(f => require('./' + f));

let targetProviderMap = new Map();
queryProviders.forEach((qp) => {
  qp.targets.forEach((t) => {
    targetProviderMap.set(t, qp);
  });
});

let allTargets = Array.from(targetProviderMap.keys());
allTargets.sort();

module.exports.targets = allTargets;

function loadDataProvider(dataProvider, cached) {
  return function loadData(argList, callback) {
    let dataset = [];
    let datasetIndex = {};
    dataProvider.targets.forEach((target) => {
      datasetIndex[target] = dataset.push({ target: target, datapoints: [] }) - 1;
    });

    let runQueryFn = cached ? runQueryCached : runQuery;
    runQueryFn(dataProvider.query, argList, (err, results) => {
      if (err) {
        return callback(err);
      }

      results.forEach((r) => {
        let target = dataProvider.getTarget(r);
        let datasetEntryIndex = datasetIndex[target];

        if (datasetEntryIndex > -1) {
          let datapoint = dataProvider.convertToDatapoint(r);
          dataset[datasetEntryIndex].datapoints.push(datapoint);
        }
      });

      callback(null, dataset);
    });
  };
}

module.exports.run = (targets, params, cached, callback) => {
  if (typeof targets === 'string') {
    targets = queryProviders.filter((qp) => qp.name === targets).pop().targets;
  } else if (!Array.isArray(targets)) {
    callback = cached;
    cached = params;
    params = targets;
    targets = allTargets;
  }

  let dataProviderNames = new Set();
  for (var t of targets) {
    if (!targetProviderMap.has(t)) {
      return callback(new Error('No data provider found for target: ' + t));
    }

    dataProviderNames.add(targetProviderMap.get(t).name);
  }

  if (!dataProviderNames.size) {
    return callback(new Error('No data providers for target(s): ' + targets.join(', ')));
  }

  let dataProviders = [];
  dataProviderNames.forEach((providerName) => {
    dataProviders.push(queryProviders.filter((qp) => qp.name === providerName).pop());
  });

  mapAsync(dataProviders, (provider, next) => {
    provider.run(loadDataProvider(provider, cached), params, next);
  }, (err, results) => {
    if (err) {
      return callback(err);
    }

    callback(null, results.reduce((o, r) => {
      o.push(...r);
      return o;
    }, []));
  });
};
