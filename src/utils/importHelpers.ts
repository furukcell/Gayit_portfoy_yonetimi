export const normalizeImportHeader = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');

export const findImportColumn = (row: Record<string, unknown>, aliases: string[]) => { const keys=Object.keys(row); const key=keys.find(k=>aliases.some(a=>normalizeImportHeader(k)===normalizeImportHeader(a))||aliases.some(a=>normalizeImportHeader(k).includes(normalizeImportHeader(a)))); return key?String(row[key]??'').trim():''; };
