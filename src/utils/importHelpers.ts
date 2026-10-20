export const normalizeImportHeader = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');

export const findImportColumn = (row: Record<string, unknown>, aliases: string[]) => { const keys=Object.keys(row); const key=keys.find(k=>aliases.some(a=>normalizeImportHeader(k)===normalizeImportHeader(a))||aliases.some(a=>normalizeImportHeader(k).includes(normalizeImportHeader(a)))); return key?String(row[key]??'').trim():''; };

export const parseSemicolonCsvLine = (line: string) => {
  const values: string[] = []; let value = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; } else if (char === '"') quoted = !quoted; else if (char === ';' && !quoted) { values.push(value); value = ''; } else value += char; }
  values.push(value); return values.map(v => v.trim());
};

export const escapeCsvCell = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
