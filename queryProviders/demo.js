'use strict';

module.exports.name = 'demo';

module.exports.targets = [
  'Target 1',
  'Target 2',
  'Target 3'
];

module.exports.getTarget = (row) => {
  return row.target;
};

module.exports.convertToDatapoint = (row) => {
  return [ parseInt(row.cnt), (Date.UTC(row.year, row.month, 0)) ];
};

module.exports.query = `
(
SELECT 'Target 1' as target, extract(year from dd) as year, extract(month from dd) as month, trunc(random() * 20 + 1) as cnt
FROM generate_series(
  (current_timestamp - '2 year'::interval)::timestamp,
  current_timestamp,
  '30 day'::interval
) dd
WHERE dd BETWEEN $2::TIMESTAMPTZ AND $3::TIMESTAMPTZ
GROUP BY 2, 3
ORDER BY 2 DESC, 3 DESC
LIMIT $1
)
UNION ALL
(
SELECT 'Target 2' as target, extract(year from dd) as year, extract(month from dd) as month, trunc(random() * 20 + 1) as cnt
FROM generate_series(
  (current_timestamp - '2 year'::interval)::timestamp,
  current_timestamp,
  '30 day'::interval
) dd
WHERE dd BETWEEN $2::TIMESTAMPTZ AND $3::TIMESTAMPTZ
GROUP BY 2, 3
ORDER BY 2 DESC, 3 DESC
LIMIT $1
)
UNION ALL
(
SELECT 'Target 3' as target, extract(year from dd) as year, extract(month from dd) as month, trunc(random() * 20 + 1) as cnt
FROM generate_series(
  (current_timestamp - '2 year'::interval)::timestamp,
  current_timestamp,
  '30 day'::interval
) dd
WHERE dd BETWEEN $2::TIMESTAMPTZ AND $3::TIMESTAMPTZ
GROUP BY 2, 3
ORDER BY 2 DESC, 3 DESC
LIMIT $1
)
`;

module.exports.run = (loadData, params, callback) => {
  let rStart = new Date(params.rangeStart);
  rStart.setHours(0, 0, 0, 0);

  let rEnd = new Date(params.rangeEnd);
  rEnd.setDate(rEnd.getDate() + 1);
  rEnd.setHours(0, 0, 0, 0);

  let argList = [ (params.limit || 100) + '', rStart.toISOString(), rEnd.toISOString() ];
  loadData(argList, callback);
};
