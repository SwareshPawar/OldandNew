// Utility to convert JSON array to Excel buffer using exceljs
const ExcelJS = require('exceljs');

async function jsonToExcelBuffer(data, sheetName = 'Data') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  if (data.length === 0) {
    worksheet.addRow(['No data']);
  } else {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    data.forEach(row => worksheet.addRow(row));
  }
  return workbook.xlsx.writeBuffer();
}

module.exports = { jsonToExcelBuffer };
