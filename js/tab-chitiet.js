// Tab 04: Chi tiết (BCQT) Rendering & Quarterly/Monthly Breakdowns

const DETAIL_ITEMS = ['Doanh thu bán hàng', 'Các khoản giảm trừ', 'Doanh thu thuần', 'Giá vốn', 'Lợi nhuận gộp', 'CPBH', 'CPQL', 'Chi phí vận hành', 'EBITDA'];

function detailPlanActual(item, monthLabel) {
  if (item === 'Doanh thu bán hàng') return [kpiVal(monthLabel, 'Doanh thu thuần', 'Kế hoạch (tỷ đồng)') || 0, kpiVal(monthLabel, 'Doanh thu thuần', 'Thực tế (tỷ đồng)') || 0];
  if (item === 'Các khoản giảm trừ') return [0, 0];
  return [kpiVal(monthLabel, item, 'Kế hoạch (tỷ đồng)') || 0, kpiVal(monthLabel, item, 'Thực tế (tỷ đồng)') || 0];
}

function switchDetailView(mode) {
  detailViewMode = mode;
  document.getElementById('btnViewMonth').className = mode === 'month' ? 'toggle-btn active' : 'toggle-btn';
  document.getElementById('btnViewQuarter').className = mode === 'quarter' ? 'toggle-btn active' : 'toggle-btn';
  document.getElementById('btnViewHalf').className = mode === 'half' ? 'toggle-btn active' : 'toggle-btn';
  document.getElementById('btnViewYear').className = mode === 'year' ? 'toggle-btn active' : 'toggle-btn';
  renderChiTiet();
}

function getPeriods(mode, monthsInYear) {
  if (mode === 'month') return monthsInYear.map(m => ({ label: `Tháng ${m}`, months: [m] }));
  if (mode === 'quarter') {
    const groups = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
    return groups.map((g, i) => ({ label: `Quý ${i + 1}`, months: g.filter(x => monthsInYear.includes(x)) })).filter(p => p.months.length);
  }
  if (mode === 'half') {
    const groups = [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]];
    return groups.map((g, i) => ({ label: `6 tháng ${i + 1}`, months: g.filter(x => monthsInYear.includes(x)) })).filter(p => p.months.length);
  }
  return [{ label: 'Cả năm', months: monthsInYear }];
}

function renderChiTiet() {
  const detailYearLabel = document.getElementById('detailYearLabel');
  if (detailYearLabel) detailYearLabel.textContent = selYear;

  const monthsInYear = allMonths.filter(x => x.y === selYear).map(x => x.m).sort((a, b) => a - b);
  const periods = getPeriods(detailViewMode, monthsInYear);
  const showCumCol = detailViewMode !== 'year' && periods.length > 0;

  const thead = document.getElementById('detailThead');
  if (!thead) return;

  let row1 = '<tr><th class="sticky-col" rowspan="2">Khoản mục</th>';
  periods.forEach(p => { row1 += `<th colspan="3">${p.label}</th>`; });
  if (showCumCol) row1 += '<th colspan="3">Lũy kế cả năm</th>';
  row1 += '</tr>';

  let row2 = '<tr>';
  periods.forEach(() => { row2 += '<th>Kế hoạch</th><th>Thực tế</th><th>Chênh lệch</th>'; });
  if (showCumCol) row2 += '<th>Kế hoạch</th><th>Thực tế</th><th>Chênh lệch</th>';
  row2 += '</tr>';
  thead.innerHTML = row1 + row2;

  const tbody = document.getElementById('detailTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!monthsInYear.length) {
    tbody.innerHTML = `<tr><td class="sticky-col">—</td><td colspan="${periods.length * 3 + (showCumCol ? 3 : 0)}" class="empty-msg">Không có dữ liệu cho năm ${selYear}.</td></tr>`;
    return;
  }

  DETAIL_ITEMS.forEach(item => {
    let cumPlan = 0, cumActual = 0;
    let cells = '';
    periods.forEach(p => {
      let plan = 0, actual = 0;
      p.months.forEach(m => {
        const lbl = `T${m}/${selYear}`;
        const [pl, ac] = detailPlanActual(item, lbl);
        plan += pl; actual += ac;
      });
      cumPlan += plan; cumActual += actual;
      const diff = actual - plan;
      const fav = favorable(item, actual, plan);
      cells += `<td class="num">${fmt(plan)}</td><td class="num">${fmt(actual)}</td><td class="num"><span class="delta-pill ${fav ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${fmt(diff)}</span></td>`;
    });
    if (showCumCol) {
      const diff = cumActual - cumPlan;
      const fav = favorable(item, cumActual, cumPlan);
      cells += `<td class="num">${fmt(cumPlan)}</td><td class="num">${fmt(cumActual)}</td><td class="num"><span class="delta-pill ${fav ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${fmt(diff)}</span></td>`;
    }
    const tr = document.createElement('tr');
    if (item === 'EBITDA') tr.className = 'total-row';
    tr.innerHTML = `<td class="sticky-col item-name">${item}</td>${cells}`;
    tbody.appendChild(tr);
  });
}

// Expose variables and functions to window scope
window.DETAIL_ITEMS = DETAIL_ITEMS;
window.detailPlanActual = detailPlanActual;
window.switchDetailView = switchDetailView;
window.getPeriods = getPeriods;
window.renderChiTiet = renderChiTiet;
