// Tab 01: Tổng quan rendering and chart components

function renderScorecards() {
  const allItems = ['Doanh thu thuần', 'Giá vốn', 'CPBH', 'CPQL', 'EBITDA'];
  const items = allItems.filter(item => kpiHasActual(selMonth, item));
  const wrap = document.getElementById('kpiCards');
  wrap.innerHTML = '';
  if (!items.length) {
    wrap.style.gridTemplateColumns = '1fr';
    wrap.innerHTML = '<div class="empty-msg">Chưa có số liệu thực tế cho tháng này.</div>';
    return;
  }
  wrap.style.gridTemplateColumns = `repeat(${items.length}, 1fr)`;
  items.forEach(item => {
    const plan = kpiVal(selMonth, item, 'Kế hoạch (tỷ đồng)') || 0;
    const actual = kpiVal(selMonth, item, 'Thực tế (tỷ đồng)') || 0;
    const fav = favorable(item, actual, plan);
    wrap.appendChild(buildScoreCard(item, actual, plan, fav));
  });
}

function renderComparison() {
  const allItems = ['Doanh thu thuần', 'Giá vốn', 'Lợi nhuận gộp', 'Chi phí vận hành', 'EBITDA'];
  const items = allItems.filter(item => kpiHasActual(selMonth, item));
  const prevLbl = prevMonthLabel(selMonth);
  const yoyLbl = sameMonthLastYearLabel(selMonth);
  const tbody = document.getElementById('cmpTableBody');
  tbody.innerHTML = '';
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Chưa có số liệu thực tế cho tháng này.</td></tr>';
    return;
  }
  items.forEach(item => {
    const cur = kpiVal(selMonth, item, 'Thực tế (tỷ đồng)') || 0;
    const prevVal = prevLbl ? kpiVal(prevLbl, item, 'Thực tế (tỷ đồng)') : null;
    const yoyVal = yoyLbl ? kpiVal(yoyLbl, item, 'Thực tế (tỷ đồng)') : null;
    const dPrev = deltaPct(cur, prevVal);
    const dYoy = deltaPct(cur, yoyVal);
    const favPrev = dPrev === null ? true : favorable(item, cur, prevVal);
    const favYoy = dYoy === null ? true : favorable(item, cur, yoyVal);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="item">${item}</td>
      <td class="num">${fmt(cur)} tỷ</td>
      <td class="num">${prevVal !== null ? fmt(prevVal) + ' tỷ' : '—'}</td>
      <td class="num">${pctPillHTML(dPrev, favPrev)}</td>
      <td class="num">${yoyVal !== null ? fmt(yoyVal) + ' tỷ' : '—'}</td>
      <td class="num">${pctPillHTML(dYoy, favYoy)}</td>`;
    tbody.appendChild(tr);
  });
}

function barLineTrend(canvasId, months, planArr, actualArr, unit) {
  destroyChart(canvasId);
  const c = chartColors();
  const BRAND = window.BRAND || '#0E3D34';
  const LINE = window.LINE || '#DCD5C9';

  chartRegistry[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Kế hoạch', data: planArr, backgroundColor: LINE, borderRadius: 4, barPercentage: 0.6 },
        { label: 'Thực tế', data: actualArr, backgroundColor: BRAND, borderRadius: 4, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, color: c.tick } } },
      scales: {
        y: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' ' + unit, color: c.tick } },
        x: { grid: { display: false }, ticks: { color: c.tick } }
      }
    }
  });
}

function cumulativeTrend(canvasId, months, planArr, actualArr, unit) {
  destroyChart(canvasId);
  const c = chartColors();
  const GOLD_BOLD = window.GOLD_BOLD || '#B8860B';
  const BRAND_DARK = window.BRAND_DARK || '#071F1A';

  chartRegistry[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'KH Lũy kế', data: planArr, borderColor: GOLD_BOLD, borderDash: [5, 4], borderWidth: 2.5, backgroundColor: 'transparent', tension: 0.2, pointRadius: 4, pointBackgroundColor: GOLD_BOLD },
        { label: 'TT Lũy kế', data: actualArr, borderColor: isDark ? GOLD_BOLD : BRAND_DARK, borderWidth: 3, backgroundColor: isDark ? 'rgba(200,161,97,0.18)' : 'rgba(14, 61, 52, 0.22)', fill: true, tension: 0.2, pointRadius: 5, pointBackgroundColor: isDark ? GOLD_BOLD : BRAND_DARK }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10, padding: 12, font: { weight: 'bold' }, color: c.tick } } },
      scales: {
        y: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' ' + unit, color: c.tick } },
        x: { grid: { display: false }, ticks: { color: c.tick } }
      }
    }
  });
}

function cumulativeArr(months, item, field) {
  let sum = 0;
  return months.map(m => {
    sum += (kpiVal(m, item, field) || 0);
    return Math.round(sum * 100) / 100;
  });
}

function renderTrends() {
  const m6 = last6Months(selMonth);
  const myear = monthsInYearUpTo(selMonth);
  barLineTrend('chartDttThang', m6, m6.map(m => kpiVal(m, 'Doanh thu thuần', 'Kế hoạch (tỷ đồng)') || 0), m6.map(m => kpiVal(m, 'Doanh thu thuần', 'Thực tế (tỷ đồng)') || 0), 'tỷ');
  cumulativeTrend('chartDttLuyKe', myear, cumulativeArr(myear, 'Doanh thu thuần', 'Kế hoạch (tỷ đồng)'), cumulativeArr(myear, 'Doanh thu thuần', 'Thực tế (tỷ đồng)'), 'tỷ');
  barLineTrend('chartGvThang', m6, m6.map(m => kpiVal(m, 'Giá vốn', 'Kế hoạch (tỷ đồng)') || 0), m6.map(m => kpiVal(m, 'Giá vốn', 'Thực tế (tỷ đồng)') || 0), 'tỷ');
  cumulativeTrend('chartGvLuyKe', myear, cumulativeArr(myear, 'Giá vốn', 'Kế hoạch (tỷ đồng)'), cumulativeArr(myear, 'Giá vốn', 'Thực tế (tỷ đồng)'), 'tỷ');
  barLineTrend('chartCpThang', m6, m6.map(m => kpiVal(m, 'Chi phí vận hành', 'Kế hoạch (tỷ đồng)') || 0), m6.map(m => kpiVal(m, 'Chi phí vận hành', 'Thực tế (tỷ đồng)') || 0), 'tỷ');
  cumulativeTrend('chartCpLuyKe', myear, cumulativeArr(myear, 'Chi phí vận hành', 'Kế hoạch (tỷ đồng)'), cumulativeArr(myear, 'Chi phí vận hành', 'Thực tế (tỷ đồng)'), 'tỷ');
}

function renderTongQuan() {
  renderScorecards();
  renderComparison();
  renderTrends();
}

// Expose functions to window scope
window.renderScorecards = renderScorecards;
window.renderComparison = renderComparison;
window.barLineTrend = barLineTrend;
window.cumulativeTrend = cumulativeTrend;
window.cumulativeArr = cumulativeArr;
window.renderTrends = renderTrends;
window.renderTongQuan = renderTongQuan;
