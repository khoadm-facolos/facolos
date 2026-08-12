// General Application Helpers & DOM Builders

function fmt(n, dp = 2) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: dp });
}

function toNum(v) {
  if (v === '' || v === undefined || v === null) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function destroyChart(key) {
  if (chartRegistry[key]) {
    chartRegistry[key].destroy();
    delete chartRegistry[key];
  }
}

function chartColors() {
  return isDark
    ? { grid: 'rgba(255, 255, 255, 0.06)', tick: '#9FB0AA' }
    : { grid: window.FAINT_GRID || 'rgba(14, 61, 52, 0.04)', tick: '#5C6B66' };
}

const DIRECTION = {
  'Doanh thu thuần': 'up',
  'Doanh thu bán hàng': 'up',
  'Các khoản giảm trừ': 'down',
  'Giá vốn': 'down',
  'Lợi nhuận gộp': 'up',
  'CPBH': 'down',
  'CPQL': 'down',
  'EBITDA': 'up',
  'Chi phí vận hành': 'down'
};

function favorable(item, cur, base) {
  const dir = DIRECTION[item] || 'up';
  return dir === 'up' ? cur >= base : cur <= base;
}

function kpiVal(monthLabel, item, field) {
  const r = RAW.kpi.find(x => x['Tháng'] === monthLabel && x['Chỉ tiêu'] === item);
  return r ? toNum(r[field]) : null;
}

function dimVal(rows, dimField, dimVal_, monthLabel, field) {
  const r = rows.find(x => x[dimField] === dimVal_ && x['Tháng'] === monthLabel);
  return r ? toNum(r[field]) : null;
}

function hasVal(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function kpiHasActual(monthLabel, item) {
  const r = RAW.kpi.find(x => x['Tháng'] === monthLabel && x['Chỉ tiêu'] === item);
  return !!(r && hasVal(r['Thực tế (tỷ đồng)']));
}

function dimHasActual(rows, dimField, dimVal_, monthLabel) {
  const r = rows.find(x => x[dimField] === dimVal_ && x['Tháng'] === monthLabel);
  return !!(r && hasVal(r['Thực tế (tỷ đồng)']));
}

function deltaPct(cur, base) {
  if (base === null || base === undefined || base === 0) return null;
  return (cur - base) / base * 100;
}

function pctPillHTML(pctVal, isFav) {
  if (pctVal === null) return '<span class="delta-pill flat">—</span>';
  const cls = isFav ? 'up' : 'down';
  const sign = pctVal >= 0 ? '+' : '';
  return `<span class="delta-pill ${cls}">${sign}${fmt(pctVal, 1)}%</span>`;
}

function buildScoreCard(label, actual, plan, fav) {
  const dPct = plan !== 0 ? (actual - plan) / plan * 100 : 0;
  const arrow = dPct === 0 ? '■' : (dPct > 0 ? '▲' : '▼');
  const sign = dPct > 0 ? '+' : '';
  const scaleMax = Math.max(actual, plan, 0.0001) * 1.08;
  const fillPct = Math.min(100, (actual / scaleMax) * 100);
  const planMark = Math.min(100, (plan / scaleMax) * 100);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="kpi-label">${label}</div>
    <div class="kpi-actual">${fmt(actual)} <span class="kpi-unit">tỷ</span></div>
    <div class="kpi-plan">KH: ${fmt(plan)} tỷ</div>
    <span class="ticker ${fav ? 'up' : 'down'}">${arrow} ${sign}${fmt(dPct, 1)}%</span>
    <div class="bar-track">
      <div class="bar-fill" style="width:${fillPct}%;background:${fav ? 'var(--brand)' : 'var(--down)'}"></div>
      <div class="bar-plan-mark" style="left:${planMark}%"></div>
    </div>`;
  return card;
}

// Expose helpers to window scope
window.fmt = fmt;
window.toNum = toNum;
window.destroyChart = destroyChart;
window.chartColors = chartColors;
window.favorable = favorable;
window.kpiVal = kpiVal;
window.dimVal = dimVal;
window.hasVal = hasVal;
window.kpiHasActual = kpiHasActual;
window.dimHasActual = dimHasActual;
window.deltaPct = deltaPct;
window.pctPillHTML = pctPillHTML;
window.buildScoreCard = buildScoreCard;
