# vtuber-schedules

## ローカルビルド

`.local.template/` の3つのJSONファイルを `.local/` へコピーし、ローカル環境に
合わせて値を編集してください。

```text
.local/
├── PAGES_JSON.json
├── AGENCY_JSON.json
└── TAGS_JSON.json
```

VS Codeの `Build GitHub Pages` を実行するか、次のコマンドでビルドできます。

```console
node scripts/build-vscode.mjs
```

`.local/` はGit管理外です。実データや秘密情報をコミットしないでください。
