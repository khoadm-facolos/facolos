// App Initialization Entry Point

function startApp(data) {
  window.RAW = data;
  if (!window.RAW.tinhThanh) window.RAW.tinhThanh = [];
  if (!window.RAW.sanPhamCT) window.RAW.sanPhamCT = [];

  window.allMonths = buildMonthList(window.RAW.kpi);
  setupDateFilters();

  const kenhSelect = document.getElementById('kenhSelect');
  const spSelect = document.getElementById('spSelect');
  const costTypeSelect = document.getElementById('costTypeSelect');
  const costStatusSelect = document.getElementById('costStatusSelect');

  if (kenhSelect) kenhSelect.value = 'ALL';
  if (spSelect) spSelect.value = 'ALL';
  if (costTypeSelect) costTypeSelect.value = 'ALL';
  if (costStatusSelect) costStatusSelect.value = 'ALL';

  window.activeTab = 'tongquan';
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const panelTongQuan = document.getElementById('panel-tongquan');
  if (panelTongQuan) panelTongQuan.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.tab === 'tongquan'));

  renderAll();

  const uploadScreen = document.getElementById('uploadScreen');
  const reportScreen = document.getElementById('reportScreen');

  if (uploadScreen) uploadScreen.style.display = 'none';
  if (reportScreen) reportScreen.style.display = 'block';
}

window.startApp = startApp;
