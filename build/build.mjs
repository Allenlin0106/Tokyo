#!/usr/bin/env node
// 建置：data/*.json + src/index.template.html + vendor/leaflet → dist/
// 用法：node build/build.mjs            （輸出到 dist/）
//       node build/build.mjs --check    （只檢查資料，不輸出）
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { validate } from './validate.mjs';
import { buildKml } from './kml.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = f => JSON.parse(rd(f));
const OUT = path.join(ROOT, 'dist');

const places = json('data/places.json');
const maps = json('data/maps.json');
const coast = json('data/coast.json');
const config = json('data/config.json');

const errors = validate({ places, maps });
if (errors.length) {
  console.error(`資料檢查失敗（${errors.length} 項）：`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`資料檢查通過：${Object.keys(places).length} 個地點、${Object.keys(maps).length} 張地圖`);
if (process.argv.includes('--check')) process.exit(0);

const template = rd('src/index.template.html');
const leafletCss = rd('vendor/leaflet/leaflet.css');
const leafletJs = rd('vendor/leaflet/leaflet.js');

// 分頁標籤（D1 7/17 六 抵達新潟）取自模板，供 KML 命名
const tabs = [...template.matchAll(/id="tab-(d\d+)"[^>]*><b>(D\d+)<\/b>([^<]*)<small>([^<]*)<\/small>/g)]
  .map(m => ({ key: m[1], d: m[2], date: m[3].trim(), title: m[4] }));
for (const t of tabs) if (!maps[t.key]) { console.error(`模板分頁 ${t.key} 在 maps.json 沒有資料`); process.exit(1); }

let sha = process.env.GITHUB_SHA || '';
if (!sha) { try { sha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch { sha = 'local'; } }
const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '/'); // 台北日期
const stamp = `建置 ${today}（${sha.slice(0, 7)}）`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, config.kml.dir), { recursive: true });

// KML
const kml = buildKml({ places, maps, tabs, name: config.kml.name, allName: config.kml.all });
for (const k of kml) fs.writeFileSync(path.join(OUT, config.kml.dir, k.file), k.text);
const kmlLinks = '下載 KML（Organic Maps／Google 我的地圖）：' +
  kml.map(k => `<a href="${config.kml.dir}/${encodeURIComponent(k.file)}" download>${k.label}</a>`).join('・');

// 每個頁面變體
const js = v => JSON.stringify(v).replace(/<\/(script)/gi, '<\\/$1');
for (const page of config.pages) {
  const bm = config.basemaps[page.basemap];
  if (!bm) { console.error(`config.pages: 找不到底圖 ${page.basemap}`); process.exit(1); }
  const rep = {
    '/*@@LEAFLET_CSS@@*/': `/* Leaflet 1.9.4 (BSD-2) */\n${leafletCss}`,
    '/*@@LEAFLET_JS@@*/': `/* Leaflet 1.9.4 (BSD-2-Clause) */\n${leafletJs}`,
    '/*@@PLACES@@*/': js(places),
    '/*@@MAPS@@*/': js(maps),
    '/*@@COAST@@*/': js(coast),
    '/*@@TILE_URL@@*/': js(bm.url),
    '/*@@TILE_ATTR@@*/': js(bm.attribution),
    '/*@@TILE_OPTS@@*/': js(bm.options || {}),
    '@@TITLE@@': page.title || config.title,
    '@@VERSION@@': config.version,
    '@@BUILD@@': stamp,
    '@@KML_LINKS@@': kmlLinks,
    '@@BASEMAP_SOURCE@@': bm.source,
    '<!--@@BANNER@@-->': page.banner ? `<div style="background:#22476a;color:#fff;font-size:13px;padding:6px 16px;text-align:center">${page.banner}</div>\n` : '',
  };
  let html = template;
  for (const [k, v] of Object.entries(rep)) {
    const n = html.split(k).length - 1;
    if (n !== 1) { console.error(`模板佔位符 ${k} 出現 ${n} 次（應為 1）`); process.exit(1); }
    html = html.replace(k, () => v);
  }
  const left = html.match(/@@[A-Z_]+@@/);
  if (left) { console.error(`模板還有未取代的佔位符：${left[0]}`); process.exit(1); }
  fs.writeFileSync(path.join(OUT, page.out), html);
  console.log(`輸出 ${page.out}（底圖 ${page.basemap}，${(html.length / 1024).toFixed(0)} KB）`);
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`輸出 ${kml.length} 個 KML 到 ${config.kml.dir}/；${stamp}`);
