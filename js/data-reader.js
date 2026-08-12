// Excel Data Mapping & Normalization Layer

const SHEET_ROLE_DEFS = {
  thongTin: {
    required: ['Trường thông tin', 'Giá trị'],
    sheetNames: ['Thong_tin', 'ThongTin', 'Sheet1']
  },
  kpi: {
    required: ['Tháng', 'Năm', 'Chỉ tiêu', 'Thực tế (tỷ đồng)', 'Kế hoạch (tỷ đồng)'],
    sheetNames: ['KPI_thang', 'KPI_Thang', 'KPI']
  },
  kenh: {
    required: ['Tháng', 'Năm', 'Kênh', 'Thực tế (tỷ đồng)', 'Kế hoạch (tỷ đồng)'],
    sheetNames: ['Kenh_thang', 'Kenh_Thang', 'Kenh']
  },
  sanPham: {
    required: ['Tháng', 'Năm', 'Sản phẩm', 'Thực tế (tỷ đồng)', 'Kế hoạch (tỷ đồng)'],
    sheetNames: ['SanPham_thang', 'SanPham_Thang', 'SanPham']
  },
  chiPhi: {
    required: ['Tháng', 'Năm', 'Phân loại', 'Khoản mục chi phí', 'Phòng ban', 'Thực tế (tỷ đồng)', 'Định mức (tỷ đồng)'],
    sheetNames: ['Chi_phi_chi_tiet', 'Chi_Phi_Chi_Tiet', 'ChiPhi']
  },
  sanPhamCT: {
    required: ['Tháng', 'Năm', 'Sản phẩm', 'Nhóm', 'Kênh', 'Doanh thu thuần (tỷ đồng)', 'Kế hoạch (tỷ đồng)'],
    sheetNames: ['SanPham_chi_tiet', 'SanPham_Chi_Tiet', 'SP_ChiTiet'],
    optional: true
  },
  tinhThanh: {
    required: ['Tháng', 'Năm', 'Tỉnh thành', 'Thực tế (tỷ đồng)', 'Kế hoạch (tỷ đồng)'],
    sheetNames: ['TinhThanh_thang', 'TinhThanh_Thang', 'TinhThanh'],
    optional: true
  }
};

function stripDiacritics(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normHeader(h) {
  if (!h) return '';
  return stripDiacritics(String(h))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function readSheetByRoles(workbook, role) {
  const def = SHEET_ROLE_DEFS[role];
  let sheet = null;
  let actualName = '';

  for (const name of workbook.SheetNames) {
    const sNorm = normHeader(name);
    const found = def.sheetNames.some(target => normHeader(target) === sNorm);
    if (found) {
      sheet = workbook.Sheets[name];
      actualName = name;
      break;
    }
  }

  if (!sheet) {
    if (def.optional) return null;
    throw new Error(`Không tìm thấy sheet dữ liệu vai trò: ${role} (Yêu cầu sheet tương tự: ${def.sheetNames.join(', ')})`);
  }

  const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rawJson.length) {
    if (def.optional) return null;
    throw new Error(`Sheet "${actualName}" rỗng.`);
  }

  const firstRow = rawJson[0];
  const keys = Object.keys(firstRow);
  const mapping = {};

  def.required.forEach(req => {
    const reqNorm = normHeader(req);
    const match = keys.find(k => normHeader(k) === reqNorm);
    if (!match) {
      throw new Error(`Sheet "${actualName}" thiếu cột bắt buộc: "${req}"`);
    }
    mapping[req] = match;
  });

  return rawJson.map(row => {
    const mapped = {};
    Object.keys(mapping).forEach(targetKey => {
      mapped[targetKey] = row[mapping[targetKey]];
    });
    // Copy remaining fields
    Object.keys(row).forEach(k => {
      if (!Object.values(mapping).includes(k)) {
        mapped[k] = row[k];
      }
    });
    return mapped;
  });
}

function normalizeMonthRows(rows) {
  if (!rows) return [];
  return rows.map(r => {
    let tVal = String(r['Tháng'] || '').trim();
    const nVal = parseInt(r['Năm']);
    if (tVal.match(/^\d+$/)) {
      tVal = `T${tVal}/${nVal}`;
    }
    return { ...r, 'Tháng': tVal, 'Năm': nVal };
  });
}

function buildSyntheticTinhThanh(kpiRows, kenhRows) {
  const allMonths = [...new Set(kpiRows.map(r => r['Tháng']))];
  const list = [];
  allMonths.forEach(m => {
    const p = parseMonth(m);
    if (!p) return;
    const actual = toNum((kpiRows.find(x => x['Tháng'] === m && x['Chỉ tiêu'] === 'Doanh thu thuần') || {})['Thực tế (tỷ đồng)']);
    const plan = toNum((kpiRows.find(x => x['Tháng'] === m && x['Chỉ tiêu'] === 'Doanh thu thuần') || {})['Kế hoạch (tỷ đồng)']);

    // Split synthetic provinces from channel rows or default
    const kenhForMonth = kenhRows.filter(x => x['Tháng'] === m);
    if (kenhForMonth.length) {
      kenhForMonth.forEach(k => {
        list.push({
          'Tháng': m,
          'Năm': p.y,
          'Tỉnh thành': k['Kênh'] || 'Khác',
          'Thực tế (tỷ đồng)': toNum(k['Thực tế (tỷ đồng)']),
          'Kế hoạch (tỷ đồng)': toNum(k['Kế hoạch (tỷ đồng)'])
        });
      });
    } else {
      list.push({
        'Tháng': m,
        'Năm': p.y,
        'Tỉnh thành': 'Miền Bắc',
        'Thực tế (tỷ đồng)': actual * 0.55,
        'Kế hoạch (tỷ đồng)': plan * 0.55
      });
      list.push({
        'Tháng': m,
        'Năm': p.y,
        'Tỉnh thành': 'Miền Nam',
        'Thực tế (tỷ đồng)': actual * 0.45,
        'Kế hoạch (tỷ đồng)': plan * 0.45
      });
    }
  });
  return list;
}

// Expose functions to window scope
window.readSheetByRoles = readSheetByRoles;
window.normalizeMonthRows = normalizeMonthRows;
window.buildSyntheticTinhThanh = buildSyntheticTinhThanh;
