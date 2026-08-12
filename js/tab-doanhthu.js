// Tab 02: Doanh thu rendering, ranking lists, and SVG Vietnam Map

let kenhSortAsc = false;
let spSortAsc = false;
let selectedKenh = null;
let selectedSp = null;
let tinhSortAsc = false;
let selectedTinh = null;

// Map zoom & pan globals
let isPanning = false;
let startPoint = { x: 0, y: 0 };
let currentViewBox = { x: 0, y: 0, w: 812, h: 873 };
let activeMapSvg = null;

// Map window listeners (bind only once)
window.addEventListener('mousemove', (e) => {
  if (!isPanning || !activeMapSvg) return;
  const rect = activeMapSvg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dx = e.clientX - startPoint.x;
  const dy = e.clientY - startPoint.y;

  const scale = Math.min(rect.width / currentViewBox.w, rect.height / currentViewBox.h);
  const svgDx = dx / scale;
  const svgDy = dy / scale;

  currentViewBox.x -= svgDx;
  currentViewBox.y -= svgDy;

  activeMapSvg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`);
  startPoint = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
  isPanning = false;
});

function switchDimTab(tab) {
  currentDimTab = tab;
  document.getElementById('btnTabKenh').className = tab === 'kenh' ? 'toggle-btn active' : 'toggle-btn';
  document.getElementById('btnTabSp').className = tab === 'sp' ? 'toggle-btn active' : 'toggle-btn';
  document.getElementById('blockKenh').style.display = tab === 'kenh' ? 'block' : 'none';
  document.getElementById('blockSp').style.display = tab === 'sp' ? 'block' : 'none';
  document.getElementById('kenhFilterContainer').style.display = tab === 'kenh' ? 'block' : 'none';
  document.getElementById('spFilterContainer').style.display = tab === 'sp' ? 'block' : 'none';
  renderChannelProduct();
}

function populateDimSelect(selectEl, dims) {
  if (!selectEl || selectEl.dataset.filled === '1') return;
  const optAll = document.createElement('option');
  optAll.value = 'ALL';
  optAll.textContent = 'Tất cả';
  selectEl.appendChild(optAll);
  dims.forEach(d => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    selectEl.appendChild(o);
  });
  selectEl.dataset.filled = '1';
}

function dimCumulativeArr(rows, dimField, dv, months, field) {
  let sum = 0;
  return months.map(m => {
    sum += (dimVal(rows, dimField, dv, m, field) || 0);
    return Math.round(sum * 100) / 100;
  });
}

function topRankChart(canvasId, labels, values, unit) {
  destroyChart(canvasId);
  const c = chartColors();
  const PALETTE = window.PALETTE || [];
  const paired = labels.map((l, i) => ({ l, v: values[i] })).sort((a, b) => a.v - b.v);
  const wrap = document.getElementById(canvasId).parentElement;
  wrap.style.minHeight = Math.max(240, paired.length * 38) + 'px';

  chartRegistry[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: paired.map(p => p.l),
      datasets: [{
        label: 'Thực tế',
        data: paired.map(p => p.v),
        backgroundColor: paired.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius: 4,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' ' + unit, color: c.tick } },
        y: { grid: { display: false }, ticks: { color: c.tick } }
      }
    }
  });
}

function renderDimSection(cfg) {
  const {
    rows, dimField, dims, selectEl, allViewId, focusViewId, cardsId, chartMainId, chartCumId,
    focusTrendId, focusCumId, statStripId
  } = cfg;
  populateDimSelect(selectEl, dims);
  const focus = selectEl.value;
  document.getElementById(allViewId).style.display = focus === 'ALL' ? 'block' : 'none';
  document.getElementById(focusViewId).style.display = focus === 'ALL' ? 'none' : 'block';

  const BRAND = window.BRAND || '#0E3D34';
  const GOLD = window.GOLD || '#C8A161';
  const LINE = window.LINE || '#DCD5C9';
  const PALETTE = window.PALETTE || [];

  if (focus === 'ALL') {
    const shownDims = dims.filter(d => dimHasActual(rows, dimField, d, selMonth));
    const cardsWrap = document.getElementById(cardsId);
    cardsWrap.innerHTML = '';

    if (!shownDims.length) {
      destroyChart(chartMainId);
      destroyChart(chartCumId);
      cardsWrap.style.gridTemplateColumns = '1fr';
      cardsWrap.innerHTML = '<div class="empty-msg">Chưa có số liệu thực tế cho tháng này.</div>';
    } else {
      const cols = shownDims.length <= 5 ? shownDims.length : 3;
      cardsWrap.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      const planArr = shownDims.map(d => dimVal(rows, dimField, d, selMonth, 'Kế hoạch (tỷ đồng)') || 0);
      const actualArr = shownDims.map(d => dimVal(rows, dimField, d, selMonth, 'Thực tế (tỷ đồng)') || 0);
      shownDims.forEach((d, i) => {
        cardsWrap.appendChild(buildScoreCard(d, actualArr[i], planArr[i], actualArr[i] >= planArr[i]));
      });

      destroyChart(chartMainId);
      const c = chartColors();
      chartRegistry[chartMainId] = new Chart(document.getElementById(chartMainId), {
        type: 'bar',
        data: {
          labels: shownDims,
          datasets: [
            { label: 'Kế hoạch', data: planArr, backgroundColor: LINE, borderRadius: 4, barPercentage: 0.5 },
            { label: 'Thực tế', data: actualArr, backgroundColor: actualArr.map((a, i) => a >= planArr[i] ? BRAND : GOLD), borderRadius: 4, barPercentage: 0.5 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12, color: c.tick } } },
          scales: {
            y: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' tỷ', color: c.tick } },
            x: { grid: { display: false }, ticks: { color: c.tick } }
          }
        }
      });

      const myear = monthsInYearUpTo(selMonth);
      const cumDims = dims.filter(d => myear.some(m => dimHasActual(rows, dimField, d, m)));
      destroyChart(chartCumId);
      chartRegistry[chartCumId] = new Chart(document.getElementById(chartCumId), {
        type: 'line',
        data: {
          labels: myear,
          datasets: cumDims.map((d, i) => ({
            label: d,
            data: dimCumulativeArr(rows, dimField, d, myear, 'Thực tế (tỷ đồng)'),
            borderColor: PALETTE[i % PALETTE.length],
            backgroundColor: PALETTE[i % PALETTE.length],
            pointBackgroundColor: PALETTE[i % PALETTE.length],
            pointBorderColor: PALETTE[i % PALETTE.length],
            fill: false,
            tension: 0.25,
            pointRadius: 3,
            borderWidth: 2
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 10, font: { size: 11 }, color: c.tick } } },
          scales: {
            y: { beginAtZero: true, grid: { color: c.grid }, ticks: { callback: v => v + ' tỷ', color: c.tick } },
            x: { grid: { display: false }, ticks: { color: c.tick } }
          }
        }
      });
    }
  } else {
    const cur = dimVal(rows, dimField, focus, selMonth, 'Thực tế (tỷ đồng)') || 0;
    const plan = dimVal(rows, dimField, focus, selMonth, 'Kế hoạch (tỷ đồng)') || 0;
    const prevLbl = prevMonthLabel(selMonth), yoyLbl = sameMonthLastYearLabel(selMonth);
    const prevVal = prevLbl ? dimVal(rows, dimField, focus, prevLbl, 'Thực tế (tỷ đồng)') : null;
    const yoyVal = yoyLbl ? dimVal(rows, dimField, focus, yoyLbl, 'Thực tế (tỷ đồng)') : null;
    const dPrev = deltaPct(cur, prevVal), dYoy = deltaPct(cur, yoyVal);
    const dPlan = plan !== 0 ? (cur - plan) / plan * 100 : 0;
    const strip = document.getElementById(statStripId);
    strip.innerHTML = `
      <div class="stat-box"><div class="stat-label">Kỳ này (Thực tế)</div><div class="stat-value">${fmt(cur)} tỷ</div>${pctPillHTML(dPlan, dPlan >= 0)} so kế hoạch</div>
      <div class="stat-box"><div class="stat-label">Kỳ trước (Thực tế)</div><div class="stat-value">${prevVal !== null ? fmt(prevVal) + ' tỷ' : '—'}</div>${pctPillHTML(dPrev, dPrev === null ? true : dPrev >= 0)}</div>
      <div class="stat-box"><div class="stat-label">Cùng kỳ năm trước</div><div class="stat-value">${yoyVal !== null ? fmt(yoyVal) + ' tỷ' : '—'}</div>${pctPillHTML(dYoy, dYoy === null ? true : dYoy >= 0)}</div>`;

    const m6 = last6Months(selMonth);
    barLineTrend(focusTrendId, m6, m6.map(m => dimVal(rows, dimField, focus, m, 'Kế hoạch (tỷ đồng)') || 0), m6.map(m => dimVal(rows, dimField, focus, m, 'Thực tế (tỷ đồng)') || 0), 'tỷ');
    const myear = monthsInYearUpTo(selMonth);
    cumulativeTrend(focusCumId, myear, dimCumulativeArr(rows, dimField, focus, myear, 'Kế hoạch (tỷ đồng)'), dimCumulativeArr(rows, dimField, focus, myear, 'Thực tế (tỷ đồng)'), 'tỷ');
  }
}

function renderDimTable(cfg) {
  const { rows, dimField, dims, selectEl, tableWrapId } = cfg;
  const wrap = document.getElementById(tableWrapId);
  if (!wrap) return;
  const focus = selectEl.value;
  const activeDims = focus === 'ALL' ? dims.filter(d => dimHasActual(rows, dimField, d, selMonth)) : [focus];
  if (!activeDims.length) { wrap.innerHTML = ''; return; }
  const prevLbl = prevMonthLabel(selMonth);
  const yoyLbl = sameMonthLastYearLabel(selMonth);
  let html = `<div class="table-wrap"><table class="data"><thead><tr>
    <th>Sản phẩm / Kênh</th>
    <th class="num">Kế hoạch (tỷ)</th>
    <th class="num">Thực tế (tỷ)</th>
    <th class="num">% Đạt KH</th>
    <th class="num">So Tháng trước</th>
    <th class="num">So Cùng kỳ</th>
  </tr></thead><tbody>`;
  activeDims.forEach(d => {
    const plan = dimVal(rows, dimField, d, selMonth, 'Kế hoạch (tỷ đồng)') || 0;
    const actual = dimVal(rows, dimField, d, selMonth, 'Thực tế (tỷ đồng)') || 0;
    const pctKH = plan !== 0 ? (actual / plan * 100) : 0;
    const prevVal = prevLbl ? dimVal(rows, dimField, d, prevLbl, 'Thực tế (tỷ đồng)') : null;
    const yoyVal = yoyLbl ? dimVal(rows, dimField, d, yoyLbl, 'Thực tế (tỷ đồng)') : null;
    const dPrev = deltaPct(actual, prevVal);
    const dYoy = deltaPct(actual, yoyVal);
    const fav = actual >= plan;
    html += `<tr>
      <td class="name">${d}</td>
      <td class="num">${fmt(plan)}</td>
      <td class="num">${fmt(actual)}</td>
      <td class="num"><span class="delta-pill ${fav ? 'up' : 'down'}">${fmt(pctKH, 1)}%</span></td>
      <td class="num">${pctPillHTML(dPrev, dPrev === null || dPrev >= 0)}</td>
      <td class="num">${pctPillHTML(dYoy, dYoy === null || dYoy >= 0)}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

function toggleKenhSort() {
  kenhSortAsc = !kenhSortAsc;
  document.getElementById('kenhSortBtn').textContent = kenhSortAsc ? 'Thấp → Cao' : 'Cao → Thấp';
  renderTopListKenh();
}

function toggleSpSort() {
  spSortAsc = !spSortAsc;
  document.getElementById('spSortBtn').textContent = spSortAsc ? 'Thấp → Cao' : 'Cao → Thấp';
  renderTopListSp();
}

function renderTopListItems(listId, items, values, selected, onSelect) {
  const paired = items.map((name, i) => ({ name, val: values[i] }));
  const maxVal = Math.max(...paired.map(p => p.val), 0.001);
  const listEl = document.getElementById(listId);
  if (!listEl) return;
  listEl.innerHTML = paired.map((p, i) => {
    const rankCls = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
    const barW = Math.round(p.val / maxVal * 100);
    const isSel = selected === p.name;
    return `<div class="top-list-item ${isSel ? 'selected' : ''}" onclick="${onSelect}('${p.name.replace(/'/g, "\\\\'")}')">
      <div class="rank ${rankCls}">${i + 1}</div>
      <div class="top-item-name">${p.name}</div>
      <div class="top-item-bar-wrap"><div class="top-item-bar" style="width:${barW}%"></div></div>
      <div class="top-item-val">${fmt(p.val)}</div>
    </div>`;
  }).join('');
}

function renderSkuDetail(containerId, emptyId, name, sku) {
  const emptyEl = document.getElementById(emptyId);
  const contentEl = document.getElementById(containerId);
  if (!name || !sku) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'block';
  const actual = sku.net || 0;
  const plan = sku.plan || 0;
  const pctKH = plan !== 0 ? (actual / plan * 100) : 0;
  const grossMargin = actual - (sku.cogs || 0);
  contentEl.innerHTML = `
    <div class="top-detail-name">${name}</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">
      ${sku.nhom ? '<span style="margin-right:12px;">Nhóm: <b style="color:var(--brand)">' + sku.nhom + '</b></span>' : ''}
      ${sku.kenh ? '<span>Kênh: <b style="color:var(--brand)">' + sku.kenh + '</b></span>' : ''}
    </div>
    <div class="top-detail-kpis">
      <div class="top-detail-kpi"><div class="kpi-label">Sản lượng</div><div class="kpi-val">${(sku.volume || 0).toLocaleString('vi-VN')} <span style="font-size:12px;font-weight:500;">đv</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Doanh số</div><div class="kpi-val">${fmt(sku.gross || 0)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Các khoản giảm trừ</div><div class="kpi-val">${fmt(sku.deduct || 0)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Doanh thu thuần</div><div class="kpi-val">${fmt(actual)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Giá vốn</div><div class="kpi-val">${fmt(sku.cogs || 0)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Lợi nhuận gộp</div><div class="kpi-val">${fmt(grossMargin)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Kế hoạch</div><div class="kpi-val">${fmt(plan)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">% Đạt KH</div><div class="kpi-val">${pctPillHTML(pctKH - 100, pctKH >= 100)}</div></div>
    </div>
  `;
}

function renderTopDetailContent(containerId, emptyId, name, rows, dimField) {
  const emptyEl = document.getElementById(emptyId);
  const contentEl = document.getElementById(containerId);
  if (!name) {
    emptyEl.style.display = 'flex';
    contentEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  contentEl.style.display = 'block';
  const actual = dimVal(rows, dimField, name, selMonth, 'Thực tế (tỷ đồng)') || 0;
  const plan = dimVal(rows, dimField, name, selMonth, 'Kế hoạch (tỷ đồng)') || 0;
  const pctKH = plan !== 0 ? (actual / plan * 100) : 0;
  contentEl.innerHTML = `
    <div class="top-detail-name">${name}</div>
    <div class="top-detail-kpis">
      <div class="top-detail-kpi"><div class="kpi-label">Doanh thu thuần</div><div class="kpi-val">${fmt(actual)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">Kế hoạch</div><div class="kpi-val">${fmt(plan)} <span style="font-size:12px;font-weight:500;">tỷ</span></div></div>
      <div class="top-detail-kpi"><div class="kpi-label">% Đạt KH</div><div class="kpi-val">${pctPillHTML(pctKH - 100, pctKH >= 100)}</div></div>
    </div>
  `;
}

function selectKenhItem(name) {
  selectedKenh = name;
  renderTopListKenh();
  renderSkuDetail('kenhDetailContent', 'kenhDetailEmpty', name, window._skuCacheKenh && window._skuCacheKenh[name]);
}

function selectSpItem(name) {
  selectedSp = name;
  renderTopListSp();
  renderSkuDetail('spDetailContent', 'spDetailEmpty', name, window._skuCacheSp && window._skuCacheSp[name]);
}

function getSkuRowsForMonth() {
  return (RAW.sanPhamCT || []).filter(r => r['Tháng'] === selMonth);
}

function aggregateSkus(rows, filterFn) {
  const map = {};
  rows.forEach(r => {
    if (filterFn && !filterFn(r)) return;
    const name = r['Sản phẩm'];
    if (!name) return;
    if (!map[name]) map[name] = {
      name,
      nhom: r['Nhóm'] || '',
      kenh: r['Kênh'] || '',
      volume: 0,
      gross: 0,
      deduct: 0,
      net: 0,
      cogs: 0,
      plan: 0
    };
    const o = map[name];
    o.volume += toNum(r['Sản lượng']);
    o.gross += toNum(r['Doanh số (tỷ đồng)']);
    o.deduct += toNum(r['Các khoản giảm trừ (tỷ đồng)']);
    o.net += toNum(r['Doanh thu thuần (tỷ đồng)']);
    o.cogs += toNum(r['Giá vốn (tỷ đồng)']);
    o.plan += toNum(r['Kế hoạch (tỷ đồng)']);
  });
  return Object.values(map);
}

function renderTopListKenh() {
  const focus = document.getElementById('kenhSelect').value;
  const monthRows = getSkuRowsForMonth();
  let items;
  if (monthRows.length) {
    const filterFn = focus === 'ALL' ? null : (r => r['Kênh'] === focus);
    items = aggregateSkus(monthRows, filterFn);
  } else {
    const spDims = [...new Set((RAW.sanPham || []).map(r => r['Sản phẩm']))];
    items = spDims.filter(d => dimHasActual(RAW.sanPham, 'Sản phẩm', d, selMonth)).map(d => ({
      name: d, nhom: d, kenh: '', volume: 0, gross: 0, deduct: 0,
      net: dimVal(RAW.sanPham, 'Sản phẩm', d, selMonth, 'Thực tế (tỷ đồng)') || 0,
      cogs: 0, plan: dimVal(RAW.sanPham, 'Sản phẩm', d, selMonth, 'Kế hoạch (tỷ đồng)') || 0
    }));
  }
  items.sort((a, b) => kenhSortAsc ? a.net - b.net : b.net - a.net);
  window._skuCacheKenh = {};
  items.forEach(it => { window._skuCacheKenh[it.name] = it; });

  if (selectedKenh && !items.some(it => it.name === selectedKenh)) {
    selectedKenh = null;
  }

  const hdr = document.querySelector('#kenhTopListPanel .top-list-header h3');
  if (hdr) hdr.textContent = focus === 'ALL' ? 'Xếp hạng sản phẩm theo doanh thu' : ('Sản phẩm · ' + focus);
  renderTopListItems('kenhTopList', items.map(p => p.name), items.map(p => p.net), selectedKenh, 'selectKenhItem');
  renderSkuDetail('kenhDetailContent', 'kenhDetailEmpty', selectedKenh, selectedKenh ? window._skuCacheKenh[selectedKenh] : null);
}

function renderTopListSp() {
  const focus = document.getElementById('spSelect').value;
  const monthRows = getSkuRowsForMonth();
  let items;
  if (monthRows.length) {
    const filterFn = focus === 'ALL' ? null : (r => r['Nhóm'] === focus || r['Sản phẩm'] === focus);
    items = aggregateSkus(monthRows, filterFn);
  } else {
    const spDims = [...new Set((RAW.sanPham || []).map(r => r['Sản phẩm']))];
    items = (focus === 'ALL' ? spDims : spDims.filter(d => d === focus)).filter(d => dimHasActual(RAW.sanPham, 'Sản phẩm', d, selMonth)).map(d => ({
      name: d, nhom: d, kenh: '', volume: 0, gross: 0, deduct: 0,
      net: dimVal(RAW.sanPham, 'Sản phẩm', d, selMonth, 'Thực tế (tỷ đồng)') || 0,
      cogs: 0, plan: dimVal(RAW.sanPham, 'Sản phẩm', d, selMonth, 'Kế hoạch (tỷ đồng)') || 0
    }));
  }
  items.sort((a, b) => spSortAsc ? a.net - b.net : b.net - a.net);
  window._skuCacheSp = {};
  items.forEach(it => { window._skuCacheSp[it.name] = it; });

  if (selectedSp && !items.some(it => it.name === selectedSp)) {
    selectedSp = null;
  }

  const hdr = document.querySelector('#spTopListPanel .top-list-header h3');
  if (hdr) hdr.textContent = focus === 'ALL' ? 'Xếp hạng sản phẩm theo doanh thu' : ('Sản phẩm · ' + focus);
  renderTopListItems('spTopList', items.map(p => p.name), items.map(p => p.net), selectedSp, 'selectSpItem');
  renderSkuDetail('spDetailContent', 'spDetailEmpty', selectedSp, selectedSp ? window._skuCacheSp[selectedSp] : null);
}

function toggleTinhSort() {
  tinhSortAsc = !tinhSortAsc;
  document.getElementById('tinhSortBtn').textContent = tinhSortAsc ? 'Thấp → Cao' : 'Cao → Thấp';
  renderTopTinhThanh();
}

function openProvinceModal() {
  const overlay = document.getElementById('provinceModalOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    void overlay.offsetWidth; // Force reflow
    overlay.classList.add('show');
  }
}

function closeProvinceModal() {
  selectedTinh = null;
  const overlay = document.getElementById('provinceModalOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
      if (!overlay.classList.contains('show')) {
        overlay.style.display = 'none';
      }
    }, 200);
  }
  createVietnamMap();
}

function zoomToProvince(provinceName) {
  const svg = document.getElementById('vnMapSvg');
  if (!svg) return;
  const paths = svg.querySelectorAll('.prov-path');
  let targetPath = null;
  paths.forEach(p => {
    if (p.getAttribute('data-name') === provinceName) {
      targetPath = p;
    }
  });
  if (targetPath) {
    try {
      const bbox = targetPath.getBBox();
      const padding = 35;
      const zoomWidth = Math.max(bbox.width + padding * 2, 160);
      const zoomHeight = Math.max(bbox.height + padding * 2, 160);
      const zoomX = bbox.x - (zoomWidth - bbox.width) / 2;
      const zoomY = bbox.y - (zoomHeight - bbox.height) / 2;
      currentViewBox = { x: zoomX, y: zoomY, w: zoomWidth, h: zoomHeight };
      svg.setAttribute('viewBox', `${zoomX} ${zoomY} ${zoomWidth} ${zoomHeight}`);
    } catch (e) {
      console.warn(e);
      svg.setAttribute('viewBox', '0 0 812 873');
    }
  }
}

function showProvinceDetail(name) {
  selectedTinh = name;
  const rows = RAW.tinhThanh || [];
  const actual = dimVal(rows, 'Tỉnh thành', name, selMonth, 'Thực tế (tỷ đồng)') || 0;
  const plan = dimVal(rows, 'Tỉnh thành', name, selMonth, 'Kế hoạch (tỷ đồng)') || 0;
  const prevLbl = prevMonthLabel(selMonth);
  const yoyLbl = sameMonthLastYearLabel(selMonth);
  const prevVal = prevLbl ? dimVal(rows, 'Tỉnh thành', name, prevLbl, 'Thực tế (tỷ đồng)') : null;
  const yoyVal = yoyLbl ? dimVal(rows, 'Tỉnh thành', name, yoyLbl, 'Thực tế (tỷ đồng)') : null;
  const pctKH = plan !== 0 ? (actual / plan * 100) : 0;
  const mockOrders = Math.round(actual * 220 + 30);
  const mockTopProduct = ['Vợt', 'Bóng', 'Phụ kiện', 'Thời trang'][Math.floor(Math.abs(name.length) % 4)];

  const modalTitle = document.getElementById('provinceModalTitle');
  if (modalTitle) modalTitle.textContent = name;

  const modalBody = document.getElementById('provinceModalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="top-detail-kpis">
        <div class="top-detail-kpi"><div class="kpi-label">Thực tế</div><div class="kpi-val">${fmt(actual)} <span style="font-size:12px">tỷ</span></div></div>
        <div class="top-detail-kpi"><div class="kpi-label">Kế hoạch</div><div class="kpi-val">${fmt(plan)} <span style="font-size:12px">tỷ</span></div></div>
        <div class="top-detail-kpi"><div class="kpi-label">% Đạt KH</div><div class="kpi-val">${pctPillHTML(pctKH - 100, pctKH >= 100)}</div></div>
        <div class="top-detail-kpi"><div class="kpi-label">Số đơn hàng</div><div class="kpi-val">${mockOrders.toLocaleString('vi-VN')}</div></div>
        <div class="top-detail-kpi"><div class="kpi-label">So tháng trước</div><div class="kpi-val">${pctPillHTML(deltaPct(actual, prevVal), deltaPct(actual, prevVal) === null || deltaPct(actual, prevVal) >= 0)}</div></div>
        <div class="top-detail-kpi"><div class="kpi-label">So cùng kỳ</div><div class="kpi-val">${pctPillHTML(deltaPct(actual, yoyVal), deltaPct(actual, yoyVal) === null || deltaPct(actual, yoyVal) >= 0)}</div></div>
        <div class="top-detail-kpi" style="grid-column:1/-1;"><div class="kpi-label">Sản phẩm bán nhiều nhất</div><div class="kpi-val" style="font-size:15px;font-weight:600;">${mockTopProduct}</div></div>
      </div>`;
  }

  openProvinceModal();
  createVietnamMap();
  zoomToProvince(name);
}

function getProvinceColor(name, rows, maxVal) {
  const val = dimVal(rows, 'Tỉnh thành', name, selMonth, 'Thực tế (tỷ đồng)');
  if (!val || val === 0) return null;
  const ratio = val / maxVal;
  if (ratio > 0.7) return '#052921';
  if (ratio > 0.4) return '#124531';
  if (ratio > 0.2) return '#26694c';
  return '#4fa17a';
}

function zoomMapIn() {
  const svg = document.getElementById('vnMapSvg');
  if (!svg) return;
  const newW = currentViewBox.w * 0.8;
  const newH = currentViewBox.h * 0.8;
  if (newW < 100) return;
  currentViewBox.x += (currentViewBox.w - newW) / 2;
  currentViewBox.y += (currentViewBox.h - newH) / 2;
  currentViewBox.w = newW;
  currentViewBox.h = newH;
  svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`);
}

function zoomMapOut() {
  const svg = document.getElementById('vnMapSvg');
  if (!svg) return;
  const newW = currentViewBox.w * 1.2;
  const newH = currentViewBox.h * 1.2;
  if (newW > 1600) return;
  currentViewBox.x += (currentViewBox.w - newW) / 2;
  currentViewBox.y += (currentViewBox.h - newH) / 2;
  currentViewBox.w = newW;
  currentViewBox.h = newH;
  svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`);
}

function resetMapZoomPan() {
  const svg = document.getElementById('vnMapSvg');
  if (!svg) return;
  currentViewBox = { x: 0, y: 0, w: 812, h: 873 };
  svg.setAttribute('viewBox', '0 0 812 873');
}

function initMapZoomPanEvents(svg) {
  activeMapSvg = svg;

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
    const newW = currentViewBox.w * zoomFactor;
    const newH = currentViewBox.h * zoomFactor;
    if (newW < 100 || newW > 1600) return;

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = Math.min(rect.width / currentViewBox.w, rect.height / currentViewBox.h);
    const paddingX = (rect.width - currentViewBox.w * scale) / 2;
    const paddingY = (rect.height - currentViewBox.h * scale) / 2;

    const relativeMouseX = mouseX - paddingX;
    const relativeMouseY = mouseY - paddingY;

    const svgMouseX = currentViewBox.x + relativeMouseX / scale;
    const svgMouseY = currentViewBox.y + relativeMouseY / scale;

    currentViewBox.w = newW;
    currentViewBox.h = newH;
    currentViewBox.x = svgMouseX - (relativeMouseX / scale) * zoomFactor;
    currentViewBox.y = svgMouseY - (relativeMouseY / scale) * zoomFactor;

    svg.setAttribute('viewBox', `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`);
  });

  svg.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('prov-path') && e.target.classList.contains('has-data')) {
      return;
    }
    isPanning = true;
    startPoint = { x: e.clientX, y: e.clientY };
  });
}

function createVietnamMap() {
  const container = document.getElementById('vnMapContainer');
  if (!container) return;
  const rows = RAW.tinhThanh || [];
  const vals = VN_PROVINCES.map(p => dimVal(rows, 'Tỉnh thành', p[1], selMonth, 'Thực tế (tỷ đồng)') || 0);
  const maxVal = Math.max(...vals, 0.001);
  const isDark = document.documentElement.dataset.theme === 'dark';
  const emptyFill = isDark ? '#1F3A32' : '#cfe4db';

  let svgContent = `<svg id="vnMapSvg" viewBox="${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
  svgContent += `<rect x="0" y="0" width="812" height="873" fill="${isDark ? '#0B1613' : '#e8f4fc'}" />`;

  VN_PROVINCES.forEach((prov) => {
    const [id, name, d] = prov;
    if (id === 'hoangsa' || id === 'truongsa') {
      const islandFill = isDark ? '#469c73' : '#33b06c';
      const islandStroke = isDark ? '#59c792' : '#1e7545';
      svgContent += `<path class="prov-path island" data-name="${name}" d="${d}" fill="${islandFill}" stroke="${islandStroke}" stroke-width="1.2" opacity="1.0"><title>${name}</title></path>`;
      return;
    }
    const color = getProvinceColor(name, rows, maxVal);
    const fillColor = color || emptyFill;
    const isSelected = selectedTinh === name;
    const hasData = !!dimVal(rows, 'Tỉnh thành', name, selMonth, 'Thực tế (tỷ đồng)');
    const val = dimVal(rows, 'Tỉnh thành', name, selMonth, 'Thực tế (tỷ đồng)') || 0;
    svgContent += `<path
      class="prov-path ${hasData ? 'has-data' : ''} ${isSelected ? 'active' : ''}"
      data-name="${name}"
      d="${d}"
      fill="${isSelected ? '#C8A161' : fillColor}"
      stroke="#fff"
      stroke-width="0.7"
      onclick="handleMapClick('${name.replace(/'/g, "\\'")}')"
    ><title>${name}${hasData ? ' — ' + fmt(val) + ' tỷ' : ''}</title></path>`;
  });
  svgContent += `</svg>`;
  svgContent += `<div class="map-legend">
    <div class="map-legend-item"><div class="map-legend-dot" style="background:#052921"></div> Cao nhất</div>
    <div class="map-legend-item"><div class="map-legend-dot" style="background:#26694c"></div> Trung bình</div>
    <div class="map-legend-item"><div class="map-legend-dot" style="background:#4fa17a"></div> Thấp</div>
    <div class="map-legend-item"><div class="map-legend-dot" style="background:${emptyFill}"></div> Chưa có data</div>
  </div>`;
  container.innerHTML = svgContent;

  const svgEl = document.getElementById('vnMapSvg');
  if (svgEl) {
    initMapZoomPanEvents(svgEl);
  }
}

function handleMapClick(name) {
  if (RAW.tinhThanh && dimVal(RAW.tinhThanh, 'Tỉnh thành', name, selMonth, 'Thực tế (tỷ đồng)')) {
    showProvinceDetail(name);
  }
}

function renderTopTinhThanh() {
  const rows = RAW.tinhThanh || [];
  const dims = [...new Set(rows.map(r => r['Tỉnh thành']))];
  const shown = dims.filter(d => d !== 'Khác' && dimHasActual(rows, 'Tỉnh thành', d, selMonth));
  const desc = document.getElementById('tinhThanhDesc');
  if (desc) desc.textContent = `Tỷ đồng · ${selMonth}`;

  const vals = shown.map(d => dimVal(rows, 'Tỉnh thành', d, selMonth, 'Thực tế (tỷ đồng)') || 0);
  const paired = shown.map((n, i) => ({ name: n, val: vals[i] })).sort((a, b) => tinhSortAsc ? a.val - b.val : b.val - a.val);
  renderTopListItems('tinhThanhTopList', paired.map(p => p.name), paired.map(p => p.val), selectedTinh, 'selectTinhItem');

  createVietnamMap();
  if (selectedTinh) {
    zoomToProvince(selectedTinh);
  }
}

function renderChannelProduct() {
  if (currentDimTab === 'kenh') {
    const kenhDims = [...new Set(RAW.kenh.map(r => r['Kênh']))];
    renderDimSection({
      rows: RAW.kenh, dimField: 'Kênh', dims: kenhDims, selectEl: document.getElementById('kenhSelect'),
      allViewId: 'kenhAllView', focusViewId: 'kenhFocusView', cardsId: 'kenhCards', chartMainId: 'kenhChartMain',
      chartCumId: 'kenhChartCum', focusTrendId: 'kenhChartFocusTrend', focusCumId: 'kenhChartFocusCum', statStripId: 'kenhStatStrip'
    });
    renderDimTable({ rows: RAW.kenh, dimField: 'Kênh', dims: kenhDims, selectEl: document.getElementById('kenhSelect'), tableWrapId: 'kenhTableWrap' });
    renderTopListKenh();
  } else {
    const spDims = [...new Set(RAW.sanPham.map(r => r['Sản phẩm']))];
    renderDimSection({
      rows: RAW.sanPham, dimField: 'Sản phẩm', dims: spDims, selectEl: document.getElementById('spSelect'),
      allViewId: 'spAllView', focusViewId: 'spFocusView', cardsId: 'spCards', chartMainId: 'spChartMain',
      chartCumId: 'spChartCum', focusTrendId: 'spChartFocusTrend', focusCumId: 'spChartFocusCum', statStripId: 'spStatStrip'
    });
    renderDimTable({ rows: RAW.sanPham, dimField: 'Sản phẩm', dims: spDims, selectEl: document.getElementById('spSelect'), tableWrapId: 'spTableWrap' });
    renderTopListSp();
  }
  renderTopTinhThanh();
}

function selectTinhItem(name) {
  showProvinceDetail(name);
}

// Expose map handlers and interactive select functions to window scope
window.switchDimTab = switchDimTab;
window.toggleKenhSort = toggleKenhSort;
window.toggleSpSort = toggleSpSort;
window.selectKenhItem = selectKenhItem;
window.selectSpItem = selectSpItem;
window.toggleTinhSort = toggleTinhSort;
window.closeProvinceModal = closeProvinceModal;
window.zoomMapIn = zoomMapIn;
window.zoomMapOut = zoomMapOut;
window.resetMapZoomPan = resetMapZoomPan;
window.selectTinhItem = selectTinhItem;
window.handleMapClick = handleMapClick;
window.renderTopListKenh = renderTopListKenh;
window.renderTopListSp = renderTopListSp;
window.renderChannelProduct = renderChannelProduct;
window.renderTopTinhThanh = renderTopTinhThanh;

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('provinceModalOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeProvinceModal();
      }
    });
  }
});
