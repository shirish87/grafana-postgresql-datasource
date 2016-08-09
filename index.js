'use strict';

let restify = require('restify');
let QueryEngine = require('./queryEngine');

let app = restify.createServer();
app.use(restify.acceptParser(app.acceptable));
app.use(restify.queryParser());
app.use(restify.bodyParser());

let rangeStartDiff = 6 * 30 * 86400 * 1000; // 6 months
let defaultQueryDataLimit = 1000;

app.get('/', (req, res) => {
  res.json({ answer: 42 });
  res.end();
});

app.post('/search', (req, res) => {
  res.json(QueryEngine.targets);
  res.end();
});

app.post('/query', (req, res) => {
  let rStart = (req.body && req.body.range && req.body.range.from) || (new Date(Date.now() - rangeStartDiff).toISOString());
  let rEnd = (req.body && req.body.range && req.body.range.to) || (new Date().toISOString());
  let targets = (req.body.targets || []).map((t) => t.target);
  let limit = req.body.maxDataPoints || defaultQueryDataLimit;

  QueryEngine.run(targets, {
    rangeStart: rStart,
    rangeEnd: rEnd,
    limit: limit
  }, true, (err, dataset) => {
    if (err) {
      console.error('error loading data', err);
    }

    res.json(dataset || []);
    res.end();
  });
});

var port = process.env.PORT || 3333;
app.listen(port);
console.log('Server is listening on port', port);
