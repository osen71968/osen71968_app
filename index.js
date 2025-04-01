const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

// Đọc file demo-die-prx.xlsx để lấy danh sách proxy bị thay đổi
const dieProxyFile = path.join(__dirname, 'demo-die-prx.xlsx');
const proxyFile = path.join(__dirname, 'quan_ly_proxy_all.xlsx');

// Tạo tên file output động với timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(__dirname, `quan_ly_proxy_all_changed_${timestamp}.xlsx`);

const dieWorkbook = xlsx.readFile(dieProxyFile);
const dieSheet = dieWorkbook.Sheets[dieWorkbook.SheetNames[0]];
const dieProxies = xlsx.utils.sheet_to_json(dieSheet, {header: 1});

const proxyChanges = new Map();
// Duyệt từ dưới lên để lấy ip mới nhất
for (let i = dieProxies.length - 1; i > 0; i--) {
    const [oldProxy, newProxy] = dieProxies[i];
    if (oldProxy && newProxy) {
        const oldIP = oldProxy.split(':')[0];
        const newIP = newProxy.split(':')[0];
        proxyChanges.set(oldIP, newIP);
    }
}

// Hàm lấy IP mới nhất
const getLatestIP = (ip) => {
    while (proxyChanges.has(ip)) {
        ip = proxyChanges.get(ip);
    }
    return ip;
};

// Đọc file quan_ly_proxy_all.xlsx và cập nhật IP mới
const workbook = xlsx.readFile(proxyFile);

const updateSheet = (sheetName, colIndex) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;
    let data = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false
    });

    for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i][colIndex]) {
            const parts = data[i][colIndex].split(':');
            console.log('parts ', parts);
            if (parts.length >= 4) {
                const latestIP = getLatestIP(parts[0]);
                if (latestIP !== parts[0]) {
                    parts[0] = latestIP;
                    data[i][colIndex] = parts.join(':');
                }
            }
        }
    }

    // Chuyển đổi lại dữ liệu thành worksheet và ghi vào workbook
    const newWorksheet = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;
};

// Cập nhật tất cả các sheet theo yêu cầu
updateSheet('TELE', 1); // Sheet1 - TELE, cột B (index 1)
updateSheet('Testnet', 1); // Sheet2 - Testnet, cột B (index 1)
updateSheet('XVip', 1); // Sheet3 - XVip, cột B (index 1)

// Ghi file mới với thông tin đã cập nhật
xlsx.writeFile(workbook, outputFile);

console.log('Cập nhật proxy thành công! File mới:', outputFile);
