'use strict';

let anyDB = require('any-db');
let config = require('./config').config;
let pool = anyDB.createPool(config.dbUrl, { min: 2, max: 20 });

function runQuery(query, params, callback) {
  pool.query(query, params, function (err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, result.rows);
  });
}

module.exports.runQuery = runQuery;
