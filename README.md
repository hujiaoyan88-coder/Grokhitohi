# ひと日

24時間を色と短いメモで残す記録。データはこのブラウザの中だけに保存される。サーバーには送らない。

## 手元で動かす

```bash
npm install
npm run dev
```

## GitHub Pages で公開する

1. このフォルダの中身を、新しいリポジトリの `main` に置く（zip 自体は上げない）。
2. リポジトリの Settings → Pages → Build and deployment を **GitHub Actions** にする。
3. `main` に push すると、`.github/workflows/pages.yml` がページを出す。
4. 出てきた URL を Chrome で開く。プレビュー用の仮アドレスとは別物なので、記録は最初から空になる。
