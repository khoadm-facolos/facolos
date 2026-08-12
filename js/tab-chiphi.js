// Tab 03: Chi phí rendering and cost components

function renderCostCards(typeF) {
  const items = [
    { key: 'Giá vốn', label: 'Giá vốn' },
    { key: 'CPBH', label: 'Chi phí bán hàng' },
    { key: 'CPQL', label: 'Chi phí quản lý' }
  ];
  const shown = typeF === 'ALL' ? items : items.filter(it => it.key === typeF || (typeF === 'Chi phí bán hàng' && it.key === 'CPBH') || (typeF === 'Chi phí quản lý' && it.key === 'CPQL'));
  const wrap = document.getElementById('costCards');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.gridTemplateColumns = `repeat(${shown.length}, 1fr)`;
  shown.forEach(it => {
    const plan = kpiVal(selMonth, it.key, 'Kế hoạch (tỷ đồng)') || 0;
    const actual = kpiVal(selMonth, it.key, 'Thực tế (tỷ đồng)') || 0;
    wrap.appendChild(buildScoreCard(it.label, actual, plan, actual <= plan));
  });
}

function renderCost() {
  const typeF = document.getElementById('costTypeSelect').value;
  const statusF = document.getElementById('costStatusSelect').value;
  renderCostCards(typeF);

  const BRAND = window.BRAND || '#0E3D34';
  const LINE = window.LINE || '#DCD5C9';
  const DOWN = window.DOWN || '#A93C3C';
  const PALETTE = window.PALETTE || [];

  if (typeF === 'Giá vốn') {
    const gvPlan = kpiVal(selMonth, 'Giá vốn', 'Kế hoạch (tỷ đồng)') || 0;
    const gvActual = kpiVal(selMonth, 'Giá vốn', 'Thực tế (tỷ đồng)') || 0;
    document.getElementById('costDesc').textContent = `Giá vốn ${selMonth}: Thực tế ${fmt(gvActual)} tỷ / Kế hoạch ${fmt(gvPlan)} tỷ (chưa có dữ liệu chi tiết theo khoản mục)`;
    destroyChart('chartCostStructure');
    const c = chartColors();
    chartRegistry['chartCostStructure'] = new Chart(document.getElementById('chartCostStructure'), {
      type: 'doughnut',
      data: { labels: ['Giá vốn (Thực tế)'], datasets: [{ data: [gvActual], backgroundColor: [BRAND], borderColor: '#FFFFFF', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 10, font: { size: 11 }, color: c.tick } } } }
    });
    destroyChart('chartCostDept');
    document.getElementById('costDeptWrap').innerHTML = '<div class="empty-msg">Giá vốn chưa được theo dõi chi tiết theo phòng ban trong file dữ liệu nguồn — chỉ có số liệu tổng theo tháng.</div>';
    const tbody = document.getElementById('costTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">Không có bảng chi tiết khoản mục cho Giá vốn. Bổ sung sheet chi tiết (tương tự Chi_phi_chi_tiet) nếu cần theo dõi sâu hơn.</td></tr>';
    const costTableHint = document.getElementById('costTableHint');
    if (costTableHint) costTableHint.style.display = 'none';
    return;
  }

  const deptWrap = document.getElementById('costDeptWrap');
  if (deptWrap && !document.getElementById('chartCostDept')) {
    deptWrap.innerHTML = '<canvas id="chartCostDept"></canvas>';
  }

  let rows = RAW.chiPhi.filter(r => r['Tháng'] === selMonth);
  if (typeF !== 'ALL') rows = rows.filter(r => r['Phân loại'] === typeF);
  rows = rows.map(r => {
    const dm = toNum(r['Định mức (tỷ đồng)']), tt = toNum(r['Thực tế (tỷ đồng)']);
    const status = tt > dm ? 'Vuot' : 'Tot';
    return { ...r, _dm: dm, _tt: tt, _diff: tt - dm, _status: status };
  });
  if (statusF !== 'ALL') rows = rows.filter(r => r._status === statusF);

  const byItem = {};
  rows.forEach(r => { byItem[r['Khoản mục chi phí']] = (byItem[r['Khoản mục chi phí']] || 0) + r._tt; });
  const itemLabels = Object.keys(byItem);
  const totalActual = itemLabels.reduce((s, k) => s + byItem[k], 0);
  document.getElementById('costDesc').textContent = `Tổng chi phí thực tế: ${fmt(totalActual)} tỷ đồng`;
  destroyChart('chartCostStructure');
  const c = chartColors();
  if (!itemLabels.length) {
    document.getElementById('costStructureWrap').innerHTML = '<div class="empty-msg">Không có dữ liệu phù hợp bộ lọc.</div>';
  } else {
    if (!document.getElementById('chartCostStructure')) document.getElementById('costStructureWrap').innerHTML = '<canvas id="chartCostStructure"></canvas>';
    chartRegistry['chartCostStructure'] = new Chart(document.getElementById('chartCostStructure'), {
      type: 'doughnut',
      data: { labels: itemLabels, datasets: [{ data: itemLabels.map(k => byItem[k]), backgroundColor: itemLabels.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: '#FFFFFF', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 10, font: { size: 11 }, color: c.tick } } } }
    });
  }

  const byDept = {};
  rows.forEach(r => { const d = r['Phòng ban']; if (!byDept[d]) byDept[d] = { dm: 0, tt: 0 }; byDept[d].dm += r._dm; byDept[d].tt += r._tt; });
  const deptLabels = Object.keys(byDept);
  destroyChart('chartCostDept');
  if (!deptLabels.length) {
    if (deptWrap) deptWrap.innerHTML = '<div class="empty-msg">Không có dữ liệu phù hợp bộ lọc.</div>';
  } else {
    chartRegistry['chartCostDept'] = new Chart(document.getElementById('chartCostDept'), {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [
          { label: 'Định mức', data: deptLabels.map(d => byDept[d].dm), backgroundColor: LINE, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Thực tế', data: deptLabels.map(d => byDept[d].tt), backgroundColor: deptLabels.map(d => byDept[d].tt <= byDept[d].dm ? BRAND : DOWN), borderRadius: 4, barPercentage: 0.6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, color: c.tick } } },
        scales: { y: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' tỷ', color: c.tick } }, x: { grid: { display: false }, ticks: { color: c.tick } } }
      }
    });
  }

  const tbody = document.getElementById('costTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">Không có dữ liệu phù hợp bộ lọc chi phí.</td></tr>'; }
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const statusLabel = r._status === 'Vuot' ? 'Vượt định mức' : 'Kiểm soát tốt';
      const statusCls = r._status === 'Vuot' ? 'down' : 'up';
      tr.innerHTML = `<td>${r['Phân loại']}</td><td class="name">${r['Khoản mục chi phí']}</td><td>${r['Phòng ban']}</td>
        <td class="num">${fmt(r._dm)}</td><td class="num">${fmt(r._tt)}</td>
        <td class="num"><span class="delta-pill ${r._diff <= 0 ? 'up' : 'down'}">${r._diff >= 0 ? '+' : ''}${fmt(r._diff)}</span></td>
        <td><span class="status-pill ${statusCls}">${statusLabel}</span></td>
        <td style="color:var(--muted); font-size:12.5px;">${r['Nguyên nhân chênh lệch'] || '—'}</td>`;
      tbody.appendChild(tr);
    });
  }
  const hintEl = document.getElementById('costRowCount');
  if (hintEl) hintEl.textContent = rows.length;
  const hintWrap = document.getElementById('costTableHint');
  if (hintWrap) hintWrap.style.display = rows.length > 8 ? 'block' : 'none';
}

// Expose functions to window scope
window.renderCostCards = renderCostCards;
window.renderCost = renderCost;
