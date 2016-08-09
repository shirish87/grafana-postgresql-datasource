'use strict';

var crypto = require('crypto');
var NodeCache = require('node-cache');
var sql = require('./sql');
var queryCache = new NodeCache();

function generateQueryHash(query, params) {
  var fullQuery = query + (params || []).join(',');
  return crypto.createHash('md5').update(fullQuery).digest('hex');
}

function checkCache(cacheKey, callback) {
  queryCache.get(cacheKey, (err, value) => {
    if (err || value === undefined) {
      return callback(err || new Error('Value not found'));
    }

    callback(null, value);
  });
}

function runQuery(query, params, callback) {
  var queryHash = generateQueryHash(query, params);
  checkCache(queryHash, (err, value) => {
    if (value) {
      console.info('Served from cache', queryHash);
      return callback(null, value);
    }

    sql.runQuery(query, params, function (err, result) {
      if (err) {
        return callback(err);
      }

      queryCache.set(queryHash, result);
      callback(null, result);
    });
  });
}

module.exports.runQuery = runQuery;
