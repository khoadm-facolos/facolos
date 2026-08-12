// Shared Application State
var RAW = null;
var allMonths = [];
var selYear = null;
var selMonthNum = null;
var selMonth = null;
var currentDimTab = 'kenh';
var detailViewMode = 'month';
var activeTab = 'tongquan';
var isDark = false;
const chartRegistry = {};
const dirty = {
  tongquan: true,
  doanhthu: true,
  chiphi: true,
  chitiet: true
};

// Expose state to window context
window.chartRegistry = chartRegistry;
window.dirty = dirty;
