// 資料檢查：任何一項不符就讓建置失敗，避免壞資料上線
const CAT = ['station', 'sight', 'park', 'shop'];
const KIND = ['tr', 'sight', 'stay', 'act', 'alt', 'fac'];
const DIR = ['top', 'bottom', 'left', 'right'];
const GLYPH = ['P', '便', '道'];
const MODE = ['car', 'rail', 'walk', 'rope'];

export function validate({ places, maps }) {
  const err = [];
  const days = Object.keys(maps).filter(k => /^d\d+$/.test(k));
  for (const [id, p] of Object.entries(places)) {
    const at = `places.${id}`;
    if (!/^[a-z0-9_]+$/.test(id)) err.push(`${at}: id 只能用小寫英數與底線`);
    for (const f of ['name', 'jp', 'note', 'gid']) if (typeof p[f] !== 'string' || !p[f].trim()) err.push(`${at}.${f}: 必填`);
    if (!Array.isArray(p.ll) || p.ll.length !== 2) err.push(`${at}.ll: 需為 [緯度, 經度]`);
    else {
      const [la, lo] = p.ll;
      if (!(la > 20 && la < 46 && lo > 122 && lo < 154)) err.push(`${at}.ll: 座標不在日本範圍 (${la}, ${lo})`);
    }
    if (!(Number.isInteger(p.lv) && p.lv >= 1 && p.lv <= 5)) err.push(`${at}.lv: 需為 1–5`);
    if (!CAT.includes(p.cat)) err.push(`${at}.cat: ${p.cat} 不在 ${CAT.join('/')}`);
    if (!KIND.includes(p.kind)) err.push(`${at}.kind: ${p.kind} 不在 ${KIND.join('/')}`);
    if (!DIR.includes(p.dir)) err.push(`${at}.dir: ${p.dir} 不在 ${DIR.join('/')}`);
    if (p.desc != null && typeof p.desc !== 'string') err.push(`${at}.desc: 需為文字`);
    if (p.note && p.note.length > 40) err.push(`${at}.note: 超過 40 字（${p.note.length}）`);
    if (p.kind === 'fac') {
      if (!GLYPH.includes(p.glyph)) err.push(`${at}.glyph: 需為 ${GLYPH.join('/')}`);
      if (!Array.isArray(p.days) || !p.days.length) err.push(`${at}.days: 設施需指定顯示日`);
      else for (const d of p.days) if (!days.includes(d)) err.push(`${at}.days: ${d} 不存在`);
      if (!Array.isArray(p.near) || !p.near.length) err.push(`${at}.near: 設施需指定所屬景點`);
      else for (const n of p.near) {
        if (!places[n]) err.push(`${at}.near: ${n} 不存在`);
        else if (places[n].kind === 'fac') err.push(`${at}.near: ${n} 不可指向另一個設施`);
      }
    }
  }
  for (const [k, m] of Object.entries(maps)) {
    const at = `maps.${k}`;
    if (!Array.isArray(m.stops) || !m.stops.length) { err.push(`${at}.stops: 必填`); continue; }
    const ids = m.stops.map(s => Array.isArray(s) ? s[0] : s);
    for (const id of ids) if (!places[id]) err.push(`${at}.stops: ${id} 不存在`);
    for (const [i, sg] of (m.seg || []).entries()) {
      if (!MODE.includes(sg[0])) err.push(`${at}.seg[${i}]: 交通方式 ${sg[0]} 不在 ${MODE.join('/')}`);
      for (const id of sg[1] || []) if (!places[id]) err.push(`${at}.seg[${i}]: ${id} 不存在`);
    }
  }
  return err;
}
