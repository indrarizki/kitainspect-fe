// AQL 2.5% lookup table — ISO 2859-1
const AQL_DATA = {
  I: [
    { from:2,     to:8,      sample:2,   ac:0, re:1 },
    { from:9,     to:15,     sample:2,   ac:0, re:1 },
    { from:16,    to:25,     sample:3,   ac:0, re:1 },
    { from:26,    to:50,     sample:5,   ac:0, re:1 },
    { from:51,    to:90,     sample:8,   ac:0, re:1 },
    { from:91,    to:150,    sample:13,  ac:1, re:2 },
    { from:151,   to:280,    sample:20,  ac:1, re:2 },
    { from:281,   to:500,    sample:32,  ac:2, re:3 },
    { from:501,   to:1200,   sample:50,  ac:3, re:4 },
    { from:1201,  to:3200,   sample:80,  ac:5, re:6 },
    { from:3201,  to:10000,  sample:125, ac:7, re:8 },
  ],
  II: [
    { from:2,     to:8,      sample:2,   ac:0, re:1 },
    { from:9,     to:15,     sample:3,   ac:0, re:1 },
    { from:16,    to:25,     sample:5,   ac:0, re:1 },
    { from:26,    to:50,     sample:8,   ac:0, re:1 },
    { from:51,    to:90,     sample:13,  ac:1, re:2 },
    { from:91,    to:150,    sample:20,  ac:1, re:2 },
    { from:151,   to:280,    sample:32,  ac:2, re:3 },
    { from:281,   to:500,    sample:50,  ac:3, re:4 },
    { from:501,   to:1200,   sample:80,  ac:5, re:6 },
    { from:1201,  to:3200,   sample:125, ac:7, re:8 },
    { from:3201,  to:10000,  sample:200, ac:10,re:11 },
    { from:10001, to:35000,  sample:315, ac:14,re:15 },
    { from:35001, to:150000, sample:500, ac:21,re:22 },
  ],
  III: [
    { from:2,     to:8,      sample:3,   ac:0, re:1 },
    { from:9,     to:15,     sample:5,   ac:0, re:1 },
    { from:16,    to:25,     sample:8,   ac:0, re:1 },
    { from:26,    to:50,     sample:13,  ac:1, re:2 },
    { from:51,    to:90,     sample:20,  ac:1, re:2 },
    { from:91,    to:150,    sample:32,  ac:2, re:3 },
    { from:151,   to:280,    sample:50,  ac:3, re:4 },
    { from:281,   to:500,    sample:80,  ac:5, re:6 },
    { from:501,   to:1200,   sample:125, ac:7, re:8 },
    { from:1201,  to:3200,   sample:200, ac:10,re:11 },
    { from:3201,  to:10000,  sample:315, ac:14,re:15 },
  ],
}

export const AqlTable = {
  lookup(lotSize, level = 'II') {
    const table = AQL_DATA[level] ?? AQL_DATA['II']
    return table.find(r => lotSize >= r.from && lotSize <= r.to) ?? table[table.length - 1]
  },

  calculate(lotSize, level = 'II') {
    if (!lotSize || lotSize < 2) return null
    const row = this.lookup(lotSize, level)
    return {
      sample_size: row.sample,
      accept_no:   row.ac,
      reject_no:   row.re,
      pct:         parseFloat(((row.sample / lotSize) * 100).toFixed(1)),
    }
  },
}

// Unit conversion
export const UnitConverter = {
  convert(value, from, to) {
    if (from === to || !value) return value
    const inMm = from === 'inches' ? value * 25.4 : from === 'cm' ? value * 10 : value
    return to === 'inches' ? inMm / 25.4 : to === 'cm' ? inMm / 10 : inMm
  },

  label(unit) {
    return { mm: 'mm', inches: 'in', cm: 'cm', degrees: '°', pcs: 'pcs', percent: '%', none: '' }[unit] ?? unit
  },
}

// Check if value is within range
export function checkRange(value, min, max) {
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
}