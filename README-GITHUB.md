# HKMAEX GitHub Pages 預覽版

這個專案已整理成可直接放到 GitHub Pages 的靜態原型，網站名稱為「香港醫美儀器交易所」，英文短名 `HKMAEX`。

## 發佈步驟

1. 建立一個新的 GitHub repository。
2. 將整個資料夾上傳到 repository。
3. 到 GitHub repository 的 `Settings` → `Pages`。
4. `Source` 選 `Deploy from a branch`。
5. `Branch` 選 `main`，資料夾選 `/docs`。
6. 儲存後等待 GitHub 產生網址，例如 `https://你的帳號.github.io/repo-name/`。

## 更新 GitHub 版

本地改完網站後，執行：

```powershell
node scripts/export-github.mjs
```

然後把更新後的 `docs` 資料夾推上 GitHub。

## Demo 限制

- 這是靜態前端原型，不是真後端。
- 公開流程以 WhatsApp 查詢及出售評估為主，沒有客人登入、收藏或站內詢問系統。
- 聯絡查詢及隱藏內部後台 demo 使用瀏覽器 `localStorage` 模擬。
- 商品資料與圖片是 demo seed data。
- 正式商用前要替換示範電話、地址、電郵及任何佔位內容，並確認商品圖片與文案使用權。
