// Excel Upload Flow, Drag and Drop, Progress Tracker, and Demo Data Binder

function setProgress(pct, label, stageNote) {
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');
  const progressLabel = document.getElementById('progressLabel');
  const progressStageNote = document.getElementById('progressStageNote');

  if (progressWrap) progressWrap.classList.add('show');
  if (progressFill) progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  if (progressPct) progressPct.textContent = Math.round(pct) + '%';
  if (label && progressLabel) progressLabel.textContent = label;
  if (stageNote && progressStageNote) progressStageNote.textContent = stageNote;
}

function hideProgress() {
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  if (progressWrap) progressWrap.classList.remove('show');
  if (progressFill) progressFill.style.width = '0%';
}

function fakeBuildProgress(cb) {
  let p = 0;
  setProgress(0, 'Đang dựng dashboard…', 'Bước 2/2 — Tạo biểu đồ & bảng số liệu');
  const timer = setInterval(() => {
    p += 14 + Math.random() * 10;
    if (p >= 100) {
      p = 100;
      clearInterval(timer);
      setProgress(100, 'Hoàn tất!', 'Bước 2/2 — Tạo biểu đồ & bảng số liệu');
      setTimeout(cb, 200);
    } else {
      setProgress(p, 'Đang dựng dashboard…', 'Bước 2/2 — Tạo biểu đồ & bảng số liệu');
    }
  }, 90);
}

function handleFile(file) {
  const statusEl = document.getElementById('uploadStatus');
  if (!statusEl) return;
  statusEl.className = 'upload-status';
  statusEl.textContent = '';
  setProgress(0, 'Đang đọc dữ liệu Excel…', `Bước 1/2 — Đọc file "${file.name}"`);

  const reader = new FileReader();
  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      setProgress((e.loaded / e.total) * 100, 'Đang đọc dữ liệu Excel…', `Bước 1/2 — Đọc file "${file.name}"`);
    }
  };

  reader.onload = (e) => {
    try {
      setProgress(100, 'Đang đọc dữ liệu Excel…', 'Bước 1/2 — Đọc file thành công, đang phân tích…');
      const wbData = new Uint8Array(e.target.result);
      const wb = XLSX.read(wbData, { type: 'array' });

      // Sheet results mapped by roles
      const sheetResults = {
        thongTin: readSheetByRoles(wb, 'thongTin'),
        kpi: readSheetByRoles(wb, 'kpi'),
        kenh: readSheetByRoles(wb, 'kenh'),
        sanPham: readSheetByRoles(wb, 'sanPham'),
        chiPhi: readSheetByRoles(wb, 'chiPhi'),
        sanPhamCT: readSheetByRoles(wb, 'sanPhamCT'),
        tinhThanh: readSheetByRoles(wb, 'tinhThanh')
      };

      const data = {
        thongTin: sheetResults.thongTin,
        kpi: normalizeMonthRows(sheetResults.kpi),
        kenh: normalizeMonthRows(sheetResults.kenh),
        sanPham: normalizeMonthRows(sheetResults.sanPham),
        chiPhi: normalizeMonthRows(sheetResults.chiPhi),
        sanPhamCT: sheetResults.sanPhamCT ? normalizeMonthRows(sheetResults.sanPhamCT) : [],
        tinhThanh: sheetResults.tinhThanh ? normalizeMonthRows(sheetResults.tinhThanh) : buildSyntheticTinhThanh(sheetResults.kpi, sheetResults.kenh)
      };

      const monthCheck = buildMonthList(data.kpi);
      if (!monthCheck.length) {
        hideProgress();
        statusEl.className = 'upload-status error';
        statusEl.textContent = 'Không đọc được tháng nào từ sheet KPI_thang. Hãy kiểm tra cột Tháng/Năm có đúng định dạng số hợp lệ, không có dòng trống ở giữa.';
        return;
      }

      statusEl.className = 'upload-status ok';
      statusEl.textContent = 'Đọc dữ liệu thành công!';
      fakeBuildProgress(() => {
        hideProgress();
        startApp(data);
      });
    } catch (err) {
      hideProgress();
      statusEl.className = 'upload-status error';
      statusEl.textContent = 'Đã xảy ra lỗi khi đọc file Excel: ' + (err && err.message ? err.message : err);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Bind upload DOM elements
document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

    ['dragover', 'dragenter'].forEach(evt => {
      dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.add('drag');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.remove('drag');
      });
    });

    dropzone.addEventListener('drop', e => {
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
  }

  const btnUseDemo = document.getElementById('btnUseDemo');
  if (btnUseDemo) {
    btnUseDemo.addEventListener('click', () => {
      const statusEl = document.getElementById('uploadStatus');
      if (statusEl) {
        statusEl.className = 'upload-status';
        statusEl.textContent = '';
      }
      fakeBuildProgress(() => {
        hideProgress();
        startApp(JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA)));
      });
      setProgress(100, 'Đang dựng dashboard…', 'Bước 2/2 — Dữ liệu mẫu Facolos');
    });
  }

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('reportScreen').style.display = 'none';
      document.getElementById('uploadScreen').style.display = 'flex';
      const uploadStatus = document.getElementById('uploadStatus');
      if (uploadStatus) {
        uploadStatus.textContent = '';
        uploadStatus.className = 'upload-status';
      }
      hideProgress();
      if (fileInput) fileInput.value = '';
    });
  }

  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!RAW) {
        alert('Chưa có dữ liệu.');
        return;
      }
      try {
        const htmlStr = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        const safeData = JSON.stringify(RAW).replace(/<\/script/gi, '<\\/script');
        const bootstrap = `\n<script>\nwindow.addEventListener('DOMContentLoaded', function(){\n  try{\n    startApp(${safeData});\n  }catch(e){\n    console.error('Lỗi khi tải báo cáo:', e);\n    var u=document.getElementById('uploadScreen'), r=document.getElementById('reportScreen');\n    if(u) u.style.display='none';\n    if(r) r.style.display='block';\n  }\n});\n<\/script>\n`;
        const closeIdx = htmlStr.lastIndexOf('</body>');
        const finalHtml = htmlStr.slice(0, closeIdx) + bootstrap + htmlStr.slice(closeIdx);
        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const info = {};
        RAW.thongTin.forEach(r => { info[r['Trường thông tin']] = r['Giá trị']; });
        const safe = ((info['Tên công ty'] || 'bao-cao') + '-' + selMonth).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
        a.href = url;
        a.download = `bao-cao-giao-ban-${safe}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert('Có lỗi khi xuất báo cáo: ' + (err && err.message ? err.message : err));
      }
    });
  }
});

// Expose variables and functions to window scope
window.setProgress = setProgress;
window.hideProgress = hideProgress;
window.fakeBuildProgress = fakeBuildProgress;
window.handleFile = handleFile;
