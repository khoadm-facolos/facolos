// Month and Date Parsing Helpers

function parseMonth(label) {
  if (!label) return null;
  const m = String(label).match(/T(\d{1,2})\/(\d{4})/);
  return m ? { m: +m[1], y: +m[2], label: `T${+m[1]}/${+m[2]}` } : null;
}

function monthKey(m) {
  return m.y * 12 + m.m;
}

function buildMonthList(rows) {
  const map = new Map();
  rows.forEach(r => {
    const p = parseMonth(r['Tháng']);
    if (p) map.set(p.label, p);
  });
  return [...map.values()].sort((a, b) => monthKey(a) - monthKey(b));
}

function monthIdx(label) {
  return allMonths.findIndex(x => x.label === label);
}

function prevMonthLabel(label) {
  const i = monthIdx(label);
  return i > 0 ? allMonths[i - 1].label : null;
}

function sameMonthLastYearLabel(label) {
  const p = parseMonth(label);
  if (!p) return null;
  const f = allMonths.find(x => x.m === p.m && x.y === p.y - 1);
  return f ? f.label : null;
}

function nextMonthLabel(label) {
  const p = parseMonth(label);
  if (!p) return '';
  let m = p.m + 1, y = p.y;
  if (m > 12) { m = 1; y++; }
  return `T${m}/${y}`;
}

function last6Months(label) {
  const i = monthIdx(label);
  const start = Math.max(0, i - 5);
  return allMonths.slice(start, i + 1).map(x => x.label);
}

function monthsInYearUpTo(label) {
  const p = parseMonth(label);
  if (!p) return [];
  return allMonths.filter(x => x.y === p.y && x.m <= p.m).map(x => x.label);
}

function buildMonthListFrom(rows) {
  const map = new Map();
  rows.forEach(r => {
    const p = parseMonth(r['Tháng']);
    if (p) map.set(p.label, p);
  });
  return [...map.values()].sort((a, b) => monthKey(a) - monthKey(b));
}

// Expose functions to window scope
window.parseMonth = parseMonth;
window.monthKey = monthKey;
window.buildMonthList = buildMonthList;
window.monthIdx = monthIdx;
window.prevMonthLabel = prevMonthLabel;
window.sameMonthLastYearLabel = sameMonthLastYearLabel;
window.nextMonthLabel = nextMonthLabel;
window.last6Months = last6Months;
window.monthsInYearUpTo = monthsInYearUpTo;
window.buildMonthListFrom = buildMonthListFrom;
