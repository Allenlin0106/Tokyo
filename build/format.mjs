// JSON 格式化：物件縮排、數字或字串組成的短陣列放同一行，方便人工編輯與 diff
export function fmt(v) {
  const s = JSON.stringify(v, null, 2);
  return s.replace(/\[\s+([^\[\]{}]*?)\s+\]/g, (m, inner) =>
    inner.length < 120 ? '[' + inner.split(/,\s*\n\s*/).join(', ') + ']' : m) + '\n';
}
