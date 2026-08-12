// UI Controls, Drawer sidebar, Tab Switching, Dark Mode and Event Listeners

async function loadTabHtml(tab) {
  const panel = document.getElementById('panel-' + tab);
  if (!panel || panel.innerHTML.trim() !== '') return; // HTML already loaded

  try {
    const res = await fetch(`pages/${tab}.html`);
    if (!res.ok) throw new Error(`Không thể tải file HTML cho trang: ${tab}`);
    const html = await res.text();
    panel.innerHTML = html;
    bindTabEvents(tab);
  } catch (err) {
    console.error(err);
    panel.innerHTML = `<div class="empty-msg text-danger">Đã xảy ra lỗi khi tải giao diện trang: ${err.message}</div>`;
  }
}

function bindTabEvents(tab) {
  if (tab === 'doanhthu') {
    const kenhSelect = document.getElementById('kenhSelect');
    const spSelect = document.getElementById('spSelect');
    if (kenhSelect) {
      kenhSelect.addEventListener('change', renderChannelProduct);
    }
    if (spSelect) {
      spSelect.addEventListener('change', renderChannelProduct);
    }
  } else if (tab === 'chiphi') {
    const costTypeSelect = document.getElementById('costTypeSelect');
    const costStatusSelect = document.getElementById('costStatusSelect');
    if (costTypeSelect) {
      costTypeSelect.addEventListener('change', renderCost);
    }
    if (costStatusSelect) {
      costStatusSelect.addEventListener('change', renderCost);
    }
  }
}

function renderHeader() {
  const info = {};
  RAW.thongTin.forEach(r => { info[r['Trường thông tin']] = r['Giá trị']; });
  const company = info['Tên công ty'] || 'CÔNG TY CỔ PHẦN ABC';

  const brandName = document.getElementById('brandName');
  const sidebarBrandName = document.getElementById('sidebarBrandName');
  const metaAuthor = document.getElementById('metaAuthor');
  const metaDate = document.getElementById('metaDate');
  const reportTitle = document.getElementById('reportTitle');
  const footerLine = document.getElementById('footerLine');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarAvatar = document.getElementById('sidebarAvatar');

  if (brandName) brandName.textContent = company;
  if (sidebarBrandName) sidebarBrandName.textContent = company;

  const reporter = info['Người lập báo cáo'] || 'Admin';
  if (metaAuthor) metaAuthor.textContent = reporter;
  if (sidebarUserName) sidebarUserName.textContent = reporter;

  if (sidebarAvatar) {
    // Trích xuất 2 chữ cái đầu viết hoa từ họ tên làm avatar
    const nameParts = reporter.trim().split(/\s+/);
    let initials = '';
    if (nameParts.length >= 2) {
      initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
    } else if (nameParts.length === 1) {
      initials = nameParts[0].substring(0, 2);
    } else {
      initials = 'AD';
    }
    sidebarAvatar.textContent = initials.toUpperCase();
  }

  if (metaDate) metaDate.textContent = info['Ngày phát hành'] || '—';

  const nxt = nextMonthLabel(selMonth);
  if (reportTitle) {
    reportTitle.textContent = `Kết quả Kinh doanh ${selMonth}${nxt ? ' & Kế hoạch ' + nxt : ''}`;
  }
  if (footerLine) {
    footerLine.textContent = `Báo cáo giao ban ${selMonth} — ${company} · Lưu hành nội bộ`;
  }
}

async function renderTab(tab) {
  await loadTabHtml(tab);
  if (tab === 'tongquan') renderTongQuan();
  else if (tab === 'doanhthu') renderChannelProduct();
  else if (tab === 'chiphi') renderCost();
  else if (tab === 'chitiet') renderChiTiet();
  dirty[tab] = false;
}

async function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const targetPanel = document.getElementById('panel-' + tab);
  if (targetPanel) targetPanel.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  if (dirty[tab]) await renderTab(tab);

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function markAllDirty() {
  Object.keys(dirty).forEach(k => { dirty[k] = true; });
}

function openDrawer() {
  const sidebarDrawer = document.getElementById('sidebarDrawer');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth >= 992) {
    document.body.classList.remove('sidebar-collapsed');
  } else {
    if (sidebarDrawer) sidebarDrawer.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('show');
  }
}

function closeDrawer() {
  const sidebarDrawer = document.getElementById('sidebarDrawer');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth >= 992) {
    document.body.classList.add('sidebar-collapsed');
  } else {
    if (sidebarDrawer) sidebarDrawer.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
  }
}

async function renderAll() {
  renderHeader();
  markAllDirty();
  await renderTab(activeTab);
}

function getAvailableYears() {
  return [...new Set(allMonths.map(x => x.y))].sort((a, b) => b - a);
}

function getMonthsForYear(y) {
  return allMonths.filter(x => x.y === y).sort((a, b) => a.m - b.m);
}

function updateMonthDropdown(y) {
  const mSel = document.getElementById('monthSelect');
  if (!mSel) return;
  mSel.innerHTML = '';
  const monthsInY = getMonthsForYear(y);
  monthsInY.forEach(mObj => {
    const o = document.createElement('option');
    o.value = mObj.m;
    o.textContent = `Tháng ${mObj.m}`;
    mSel.appendChild(o);
  });
  if (monthsInY.length > 0) {
    const matchCurrent = monthsInY.find(x => x.m === selMonthNum);
    selMonthNum = matchCurrent ? matchCurrent.m : monthsInY[monthsInY.length - 1].m;
    mSel.value = selMonthNum;
  }
}

function setupDateFilters() {
  const ySel = document.getElementById('yearSelect');
  if (!ySel) return;
  ySel.innerHTML = '';
  const years = getAvailableYears();
  years.forEach(y => {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = `Năm ${y}`;
    ySel.appendChild(o);
  });

  let defaultMonthObj = null;
  for (let i = allMonths.length - 1; i >= 0; i--) {
    const lbl = allMonths[i].label;
    const v = kpiVal(lbl, 'Doanh thu thuần', 'Thực tế (tỷ đồng)');
    if (v && v > 0) { defaultMonthObj = allMonths[i]; break; }
  }
  if (!defaultMonthObj && allMonths.length) defaultMonthObj = allMonths[allMonths.length - 1];

  selYear = defaultMonthObj ? defaultMonthObj.y : (years[0] || new Date().getFullYear());
  selMonthNum = defaultMonthObj ? defaultMonthObj.m : 1;
  ySel.value = selYear;
  updateMonthDropdown(selYear);
  selMonth = `T${selMonthNum}/${selYear}`;
}

// Bind Global UI events
document.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');

  if (yearSelect) {
    yearSelect.addEventListener('change', e => {
      selYear = parseInt(e.target.value);
      updateMonthDropdown(selYear);
      selMonth = `T${selMonthNum}/${selYear}`;
      renderAll();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', e => {
      selMonthNum = parseInt(e.target.value);
      selMonth = `T${selMonthNum}/${selYear}`;
      renderAll();
    });
  }

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      switchTab(a.dataset.tab);
      if (window.innerWidth < 992) {
        closeDrawer();
      }
    });
  });

  const btnHamburger = document.getElementById('btnHamburger');
  if (btnHamburger) {
    btnHamburger.addEventListener('click', () => {
      if (window.innerWidth >= 992) {
        if (document.body.classList.contains('sidebar-collapsed')) {
          openDrawer();
        } else {
          closeDrawer();
        }
      } else {
        const drawer = document.getElementById('sidebarDrawer');
        if (drawer && drawer.classList.contains('open')) closeDrawer(); else openDrawer();
      }
    });
  }

  const btnSidebarClose = document.getElementById('btnSidebarClose');
  if (btnSidebarClose) {
    btnSidebarClose.addEventListener('click', closeDrawer);
  }
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeDrawer);
  }

  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      isDark = !isDark;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      darkToggle.classList.toggle('on', isDark);
      if (RAW) {
        markAllDirty();
        renderTab(activeTab);
      }
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      Object.values(chartRegistry).forEach(ch => {
        try { ch.resize(); } catch (e) { }
      });
    }, 150);
  });
});

// Expose variables and functions to window scope
window.renderHeader = renderHeader;
window.renderTab = renderTab;
window.switchTab = switchTab;
window.markAllDirty = markAllDirty;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.renderAll = renderAll;
window.getAvailableYears = getAvailableYears;
window.getMonthsForYear = getMonthsForYear;
window.updateMonthDropdown = updateMonthDropdown;
window.setupDateFilters = setupDateFilters;
