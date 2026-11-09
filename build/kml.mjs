// 由同一份資料產生 KML（Organic Maps／Google 我的地圖）
const x = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STY = { stay: ['placemark-green', 'ff3c8a2f'], sight: ['placemark-red', 'ff2b3ba9'], act: ['placemark-orange', 'ff1f8ae0'],
  tr: ['placemark-blue', 'ffb0732a'], alt: ['placemark-gray', 'ff808080'], fac: ['placemark-purple', 'ff8a4a5b'] };
const LINE = { car: 'ff2b3ba9', rail: 'ffb0732a', walk: 'ff333333', rope: 'ff3c8a2f' };
const MODE = { car: '開車', rail: '鐵路', walk: '步行', rope: '纜車' };
const NUM = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫';
const FACT = { P: '停車場', '便': '便利商店', '道': '道の駅' };
const KLAB = { tr: '交通', sight: '景點', stay: '住宿', act: '活動・溫泉', alt: '備案', fac: '周邊設施' };

const gurl = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.jp) + (p.gid ? '&query_place_id=' + p.gid : '');
function placemark(p, label) {
  const lines = [p.desc || p.note];
  if (p.desc && p.note) lines.push('【實用資訊】' + p.note);
  lines.push('【當地名稱】' + p.jp);
  if (p.kind === 'fac') lines.push('（資料：Google Maps 搜尋）');
  lines.push(gurl(p));
  const sty = STY[p.kind] || STY.sight;
  return `<Placemark><name>${x(label)}</name><description>${x(lines.join('\n'))}</description><styleUrl>#${sty[0]}</styleUrl>` +
    `<ExtendedData><Data name="type"><value>${x(p.kind === 'fac' ? FACT[p.glyph] : KLAB[p.kind])}</value></Data></ExtendedData>` +
    `<Point><coordinates>${p.ll[1]},${p.ll[0]},0</coordinates></Point></Placemark>`;
}
function styles() {
  let o = '';
  for (const k in STY) { const [id, c] = STY[k]; o += `<Style id="${id}"><IconStyle><color>${c}</color><scale>1.1</scale><Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>`; }
  for (const k in LINE) o += `<Style id="line-${k}"><LineStyle><color>${LINE[k]}</color><width>4</width></LineStyle></Style>`;
  return o;
}
function dayBody(PL, cfg, d) {
  let n = 0, o = '';
  const stops = cfg.stops.map(st => { const id = Array.isArray(st) ? st[0] : st; let lab; if (Array.isArray(st)) lab = st[1]; else { n++; lab = String(n); } return { id, lab }; });
  for (const { id, lab } of stops) { const k = +lab; o += placemark(PL[id], (k >= 1 && k <= 12 ? NUM[k - 1] + ' ' : '') + PL[id].name); }
  for (const k of Object.keys(PL)) {
    const p = PL[k];
    if (p.kind !== 'fac' || !(p.days || []).includes(d)) continue;
    const near = (p.near || []).filter(i => stops.some(s => s.id === i)).map(i => PL[i].name);
    o += placemark(p, '[' + FACT[p.glyph] + '] ' + p.name + (near.length ? '（' + near[0] + '）' : ''));
  }
  for (const [mode, ids] of cfg.seg || []) {
    o += `<Placemark><name>${x('路線示意：' + ids.map(i => PL[i].name).join(' → '))}</name><description>${x('直線示意，非實際道路；導航請用 Google／Apple 地圖。交通方式：' + MODE[mode])}</description><styleUrl>#line-${mode}</styleUrl>` +
      `<LineString><tessellate>1</tessellate><coordinates>${ids.map(i => PL[i].ll[1] + ',' + PL[i].ll[0] + ',0').join(' ')}</coordinates></LineString></Placemark>`;
  }
  return o;
}
const head = name => `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${x(name)}</name>`;

// tabs: [{key:'d1', d:'D1', date:'7/17 六', title:'抵達新潟'}]
export function buildKml({ places, maps, tabs, name, allName }) {
  const files = [];
  for (const t of tabs) {
    const nm = `${t.d} ${t.date} ${t.title}`;
    files.push({ file: `${t.d}-${t.date.split(' ')[0].replace('/', '')}.kml`, label: t.d,
      text: head(nm) + `<description>${x(name + '｜' + nm + '｜景點依當天順序編號，[ ] 為周邊設施')}</description>` + styles() + dayBody(places, maps[t.key], t.key) + '</Document></kml>\n' });
  }
  let all = head(name) + styles();
  for (const t of tabs) all += `<Folder><name>${x(`${t.d} ${t.date} ${t.title}`)}</name>${dayBody(places, maps[t.key], t.key)}</Folder>`;
  files.push({ file: allName, label: '全程', text: all + '</Document></kml>\n' });
  return files;
}
