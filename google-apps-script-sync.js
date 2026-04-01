const CONFIG = {
  rootFolderId: 'TU_ROOT_FOLDER_ID',
  sheetName: 'Transacciones',
  summarySheetName: 'Resumen',
  startRow: 5,
  token: 'TU_TOKEN_DE_ESCRITURA',
  syncToken: 'TU_TOKEN_DE_LECTURA_O_EL_MISMO_SI_PREFIERES',
  monthFilePrefix: 'Contabilidad ',
  templateFileName: 'Original',
  autoCreateMonthFile: true,

  blocks: {
    gasto: { startCol: 2 },
    ingreso: { startCol: 7 }
  },

  summary: {
    openingBalanceCell: 'L8',
    budgetStartRow: 28,
    budgetEndRow: 44,
    expenseCategoryCol: 2,
    expensePlannedCol: 4,
    incomeCategoryCol: 8,
    incomePlannedCol: 10
  }
};

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function doGet(e) {
  try {
    const token = String((e && e.parameter && e.parameter.token) || '').trim();

    if (token !== String(CONFIG.syncToken || CONFIG.token)) {
      throw new Error('Token inválido');
    }

    const year = Number((e && e.parameter && e.parameter.year) || '');
    const month = Number((e && e.parameter && e.parameter.month) || '');

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('Debes enviar year y month válidos, por ejemplo year=2026&month=3');
    }

    const targetDate = new Date(year, month - 1, 1);
    const spreadsheet = resolveSpreadsheetForDate(targetDate);
    const exportPayload = buildMonthExport(spreadsheet, year, month);

    return jsonResponse({
      ok: true,
      ...exportPayload
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No llegó ningún cuerpo en la petición');
    }

    const payload = JSON.parse(e.postData.contents);

    if (String(payload.token || '') !== CONFIG.token) {
      throw new Error('Token inválido');
    }

    const tipo = String(payload.tipo || '').trim().toLowerCase();
    if (!['gasto', 'ingreso'].includes(tipo)) {
      throw new Error('Tipo inválido, debe ser "gasto" o "ingreso"');
    }

    const importe = parseImporte(payload.importe);
    const descripcion = clean(payload.descripcion);
    const categoria = clean(payload.categoria);

    if (!descripcion) {
      throw new Error('Falta la descripción');
    }

    if (!categoria) {
      throw new Error('Falta la categoría');
    }

    const fechaMovimiento = payload.fecha
      ? parseFechaUsuario(payload.fecha)
      : new Date();

    const fechaTexto = payload.fecha
      ? String(payload.fecha).trim()
      : Utilities.formatDate(
          fechaMovimiento,
          Session.getScriptTimeZone(),
          'd/MM/yyyy'
        );

    const spreadsheet = resolveSpreadsheetForDate(fechaMovimiento);
    const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

    if (!sheet) {
      throw new Error(`No existe la hoja "${CONFIG.sheetName}" en "${spreadsheet.getName()}"`);
    }

    const startCol = CONFIG.blocks[tipo].startCol;
    const row = getNextRowForBlock(sheet, CONFIG.startRow, startCol);

    sheet.getRange(row, startCol, 1, 4).setValues([
      [fechaTexto, importe, descripcion, categoria]
    ]);

    return jsonResponse({
      ok: true,
      tipo,
      archivo: spreadsheet.getName(),
      hoja: CONFIG.sheetName,
      fila: row,
      fecha: fechaTexto
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function buildMonthExport(spreadsheet, year, month) {
  const txSheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  const summarySheet = spreadsheet.getSheetByName(CONFIG.summarySheetName);

  if (!txSheet) {
    throw new Error(`No existe la hoja "${CONFIG.sheetName}" en "${spreadsheet.getName()}"`);
  }

  if (!summarySheet) {
    throw new Error(`No existe la hoja "${CONFIG.summarySheetName}" en "${spreadsheet.getName()}"`);
  }

  const openingBalanceRaw = summarySheet.getRange(CONFIG.summary.openingBalanceCell).getValue();
  const openingBalance = Number(openingBalanceRaw || 0);

  const transactions = []
    .concat(readTransactionsBlock(txSheet, 'expense', CONFIG.blocks.gasto.startCol))
    .concat(readTransactionsBlock(txSheet, 'income', CONFIG.blocks.ingreso.startCol));

  const budgets = []
    .concat(readBudgetBlock(summarySheet, 'expense', CONFIG.summary.expenseCategoryCol, CONFIG.summary.expensePlannedCol))
    .concat(readBudgetBlock(summarySheet, 'income', CONFIG.summary.incomeCategoryCol, CONFIG.summary.incomePlannedCol));

  return {
    year,
    month,
    fileId: spreadsheet.getId(),
    fileName: spreadsheet.getName(),
    sheetName: CONFIG.sheetName,
    summarySheetName: CONFIG.summarySheetName,
    openingBalance: isFinite(openingBalance) ? openingBalance : 0,
    transactions,
    budgets
  };
}

function readTransactionsBlock(sheet, type, startCol) {
  const lastRow = getLastUsedRowInColumn(sheet, CONFIG.startRow, startCol);

  if (lastRow < CONFIG.startRow) {
    return [];
  }

  const values = sheet
    .getRange(CONFIG.startRow, startCol, lastRow - CONFIG.startRow + 1, 4)
    .getDisplayValues();

  const rows = [];

  for (let index = 0; index < values.length; index++) {
    const rowNumber = CONFIG.startRow + index;
    const row = values[index];

    const fecha = clean(row[0]);
    const importe = clean(row[1]);
    const descripcion = clean(row[2]);
    const categoria = clean(row[3]);

    if (!fecha && !importe && !descripcion && !categoria) {
      continue;
    }

    if (!fecha || !descripcion || !categoria) {
      continue;
    }

    rows.push({
      type,
      transactionDate: toIsoDateFromUserInput(fecha),
      amount: parseImporte(importe),
      description: descripcion,
      categoryName: categoria,
      sourceRow: rowNumber
    });
  }

  return rows;
}

function readBudgetBlock(sheet, type, categoryCol, plannedCol) {
  const rows = [];

  for (let row = CONFIG.summary.budgetStartRow; row <= CONFIG.summary.budgetEndRow; row++) {
    const categoryName = clean(sheet.getRange(row, categoryCol).getDisplayValue());
    const plannedRaw = clean(sheet.getRange(row, plannedCol).getDisplayValue());

    if (!categoryName) {
      continue;
    }

    rows.push({
      type,
      categoryName,
      plannedAmount: plannedRaw ? parseImporte(plannedRaw) : 0
    });
  }

  return rows;
}

function resolveSpreadsheetForDate(dateObj) {
  const tz = Session.getScriptTimeZone();
  const yearName = Utilities.formatDate(dateObj, tz, 'yyyy');
  const monthNumber = Number(Utilities.formatDate(dateObj, tz, 'M'));
  const monthName = MONTHS_ES[monthNumber - 1];
  const targetFileName = CONFIG.monthFilePrefix + monthName;

  const rootFolder = DriveApp.getFolderById(CONFIG.rootFolderId);
  const yearFolder = getSingleFolderByName(rootFolder, yearName);

  let targetFile = getSingleFileByName(yearFolder, targetFileName);

  if (!targetFile) {
    if (!CONFIG.autoCreateMonthFile) {
      throw new Error(`No existe el archivo "${targetFileName}" en la carpeta "${yearName}"`);
    }

    const templateFile = getSingleFileByName(yearFolder, CONFIG.templateFileName);
    if (!templateFile) {
      throw new Error(`No existe la plantilla "${CONFIG.templateFileName}" en la carpeta "${yearName}"`);
    }

    targetFile = templateFile.makeCopy(targetFileName, yearFolder);
  }

  return SpreadsheetApp.openById(targetFile.getId());
}

function getSingleFolderByName(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (!folders.hasNext()) {
    throw new Error(`No existe la carpeta "${folderName}" dentro de la carpeta raíz`);
  }

  return folders.next();
}

function getSingleFileByName(folder, fileName) {
  const files = folder.getFilesByName(fileName);

  if (!files.hasNext()) {
    return null;
  }

  return files.next();
}

function getNextRowForBlock(sheet, startRow, dateCol) {
  const totalRows = sheet.getMaxRows() - startRow + 1;
  const values = sheet.getRange(startRow, dateCol, totalRows, 1).getDisplayValues();

  let lastUsedRow = startRow - 1;

  for (let i = 0; i < values.length; i++) {
    const cellValue = String(values[i][0] || '').trim();
    if (cellValue !== '') {
      lastUsedRow = startRow + i;
    }
  }

  return lastUsedRow + 1;
}

function getLastUsedRowInColumn(sheet, startRow, col) {
  const totalRows = sheet.getMaxRows() - startRow + 1;
  const values = sheet.getRange(startRow, col, totalRows, 1).getDisplayValues();

  let lastUsedRow = startRow - 1;

  for (let index = 0; index < values.length; index++) {
    const value = clean(values[index][0]);
    if (value) {
      lastUsedRow = startRow + index;
    }
  }

  return lastUsedRow;
}

function parseImporte(value) {
  if (typeof value === 'number') {
    if (!isFinite(value)) {
      throw new Error('Importe inválido');
    }
    return value;
  }

  let raw = String(value ?? '').trim();
  raw = raw.replace(/\s/g, '').replace('€', '');

  let normalized = raw;

  if (raw.includes(',') && raw.includes('.')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = raw.replace(',', '.');
  }

  const num = Number(normalized);

  if (!isFinite(num)) {
    throw new Error('Importe inválido');
  }

  return num;
}

function parseFechaUsuario(text) {
  const raw = String(text || '').trim();
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    throw new Error('La fecha debe ir en formato d/MM/yyyy, por ejemplo 7/03/2026');
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  return new Date(year, month - 1, day);
}

function toIsoDateFromUserInput(text) {
  const date = parseFechaUsuario(text);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function clean(value) {
  return String(value ?? '').trim();
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
