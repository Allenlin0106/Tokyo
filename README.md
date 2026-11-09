# 越後・上州 9 日｜新潟 → 東京（2027/07/17–07/25）

親子行程手冊：每日分頁、景點區塊地圖、底部資訊視窗、三種風格（標準／手繪／漫畫）。

- 線上版：https://allenlin0106.github.io/Tokyo/
- 底圖預覽（地理院淡色地図）：https://allenlin0106.github.io/Tokyo/preview.html
- KML（Organic Maps／Google 我的地圖）：網頁頁尾的下載連結

## 檔案結構

| 路徑 | 內容 | 什麼時候改 |
|---|---|---|
| `data/places.json` | 所有地點（景點、住宿、周邊設施）：名稱、座標、place_id、分級、說明 | 新增或修改地點、說明、營業資訊 |
| `data/maps.json` | 總覽與 D1–D9 的站點順序與路段（交通方式） | 調整行程順序或移動方式 |
| `data/config.json` | 標題、版本號、底圖、輸出頁面、KML 設定 | 改版本號、換底圖、增減預覽頁 |
| `data/coast.json` | 離線用的簡化海岸線 | 幾乎不用改 |
| `src/index.template.html` | 版型：行程文字、表格、插畫、CSS、地圖程式 | 改行程內容、版面或功能 |
| `vendor/leaflet/` | Leaflet 1.9.4（建置時內嵌） | 升級 Leaflet 時 |
| `build/` | 建置腳本、資料檢查、KML 產生器 | 改建置流程時 |
| `dist/` | 建置結果（不進 git） | 不要手動改 |

## 更新流程

1. 改 `data/*.json` 或 `src/index.template.html`，並把 `data/config.json` 的 `version` 加一。
2. 本機檢查（選用，需要 Node.js 22 以上）：
   ```bash
   node build/build.mjs --check   # 只檢查資料
   node build/build.mjs           # 建置到 dist/，直接開 dist/index.html 看
   ```
3. push 到 `main`：GitHub Actions 會先檢查資料，通過才建置並部署；資料有錯會在 Actions 列出原因，線上版維持不變。
4. 開 pull request 時只會檢查與建置，不會部署。

## 資料規則（建置時自動檢查）

- 每個地點必填 `name`、`jp`、`ll`（日本範圍內）、`lv`（1–5）、`cat`、`kind`、`dir`、`note`（40 字內）、`gid`（Google place_id）。
- 周邊設施（`kind: "fac"`）必填 `glyph`（P／便／道）、`days`（顯示在哪幾天）、`near`（所屬景點 id）。
- `maps.json` 的站點與路段只能引用 `places.json` 已有的 id；交通方式限 `car`／`rail`／`walk`／`rope`。

## 出典

- 地點座標與周邊設施：Google Maps
- 底圖：OpenStreetMap contributors；預覽頁為国土地理院（地理院タイル）
- 地圖函式庫：Leaflet（BSD-2-Clause）
