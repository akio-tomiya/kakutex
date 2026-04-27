# KakuTeX 管理者向け導入マニュアル

## 1. 配布物の構成

この作業パッケージは、アプリ本体、例、仕様書、ユーザーマニュアル、管理者向け導入マニュアル、テスト、作業ログ、途中メモ、チェックリストを 1 つのディレクトリにまとめています。公開対象の本体は `app/` です。仕様書は `docs/spec/`、マニュアルは `docs/user_manual/` と `docs/admin_manual/`、テストは `tests/`、作業記録は `docs/logs/`、途中メモとチェックリストは `docs/memos/` と `docs/checklists/` にあります。ユーザーマニュアルは Markdown を正本とし、日本語 / 英語の PDF と HTML を生成します。

MathJax browser bundle は `app/vendor/mathjax/` に同梱しています。したがって、通常公開時に第三者 CDN へ依存しません。ネット接続前提で使う構成ですが、同一ファイル群をオフライン配布へ流用できるようにしてあります。

## 2. 推奨公開形態

### 2.1 個人ホームページや静的ホストへの配置

`app/` をそのまま静的ファイルとして置けば動きます。`index.html` がエントリです。相対パスで参照しているので、ドメイン直下でもサブディレクトリでも動きます。たとえば、`https://example.org/tools/kakutex/app/` のような配置で問題ありません。

### 2.2 GitHub での管理

ソースの正本は GitHub リポジトリに置く想定です。`main` を安定版、`dev` を作業版に分ける運用が扱いやすいです。配布用 ZIP を GitHub Releases に添付し、公開サイトには `app/` を配置するのが自然です。

### 2.3 オフライン配布オプション

この版はネット接続下での利用を本線にしていますが、依存ライブラリは同梱済みです。そのため、`app/` を含む配布 ZIP をそのまま展開して静的に配ることができます。ただし `file://` 直開きは環境差が残るので、現時点では「案内表示つきで編集は継続できる」段階です。完全な `file://` 対応はバックログに残しています。

保存先とファイル名を選べるネイティブ保存ダイアログは、対応ブラウザかつ secure context で有効です。したがって、公開本体は `https:` 配信を推奨します。ローカル確認では `localhost` と `127.0.0.1` でも同様に動きます。

## 3. ローカル確認

開発時と受け取り確認時は、簡単な静的サーバを使ってください。最小手順は次です。

```bash
cd kakutex_project
python3 -m http.server 8000
# http://127.0.0.1:8000/app/
```

`file://` 直開きでも UI は出ますが、MathJax 初期化や印刷まわりの挙動差を避けるため、静的配信での確認を推奨します。

## 4. 実装の要点

### 4.1 実装形態

この版の参照実装は、素の HTML/CSS/JavaScript と MathJax 3 で構成しています。フレームワークやバックエンドは使っていません。バンドラ前提ではなく、`app/` 配下の静的ファイルをそのまま公開できます。初回起動時の UI 言語はブラウザ言語から決めます。`navigator.languages` と `navigator.language` を見て、日本語系なら日本語 UI、それ以外は英語 UI にします。サンプル本文は UI 言語に関係なく英語で始め、`\slashed{D} = \gamma^\mu A_\mu` を含みます。情報ボタンと版番号は、版確認用の About 風ダイアログを開きます。ヘルプボタンは現在の UI 言語に応じた HTML ユーザーマニュアルを新しいタブで開き、`#basic-operations` へ移動します。HTML マニュアルの先頭には対応する PDF 版へのリンクを置きます。

### 4.2 パーサ戦略

本物の LaTeX パーサは作っていません。実装は「ブロック分割器」です。見出し、段落、数式ブロック、リストを軽く識別し、未知の `\begin{...}` は未対応ブロックとして保持します。

### 4.3 マクロ戦略

ユーザー定義マクロは引数なし `\newcommand` のみです。MathJax 側に動的マクロ辞書を渡すだけでなく、プレビュー補助側でも no-argument macro を数式断片へ前展開します。これにより、`\newcommand{\Tr}{\operatorname{Tr}}` のような短い演算子マクロが安定して反映されます。`\slashed{...}` は組み込みマクロです。

さらに、math block の中に `enumerate` や `\item` のような文書用構文が紛れたときは、parser が `diagMathNestedEnv` と `diagMathItem` を出して診断欄へ見せます。今回の版では、本文側でも `diagItemOutsideList`、`diagIllegalHash`、`diagFracSyntax`、`diagUnknownMathCommand`、`diagUnknownTextCommand` を追加し、`$\info$`、裸の `#`、不完全な `\frac_`、リスト外の `\item` のような典型的な入力ミスを拾います。

### 4.4 段落とインライン数式の戦略

段落全体をそのまま数式エンジンへ流さず、`$...$` と `\(...\)` の断片だけを切り出して数式扱いにします。この方針により、本文中の `\` が右ペインで `\` 1 本に化ける不具合を避け、段落中の `\` は明示改行として描画できます。

### 4.5 Sync 戦略

Sync は文字単位ではなくブロック単位です。左のカーソル位置から最も近い top-level block を選び、右ペインをスクロールします。右側から左へ戻すときも同じ block range を使います。

### 4.6 エディタとスクロール戦略

左エディタは通常の `textarea` です。overlay 型簡易ハイライトは、一部ブラウザで文字が薄く見えたり、IME 入力時に表示が不安定になることがあったため、この版では採用していません。ソース欄、新規コマンド欄、プレビュー欄、診断欄はそれぞれ内部スクロールするように CSS を固定しています。今回の版では上部メニューをより薄いフラット寄りにし、中央の Sync は小型の矢印ボタンへ整理し、状態メッセージをプレビュー見出しの右へ移しています。

### 4.7 `.texs` 戦略

アプリ内で ZIP store method のみを自前実装しています。v1 は自分で保存した `.texs` を確実に往復できることを優先しています。一般の圧縮 ZIP 互換を広げる場合は、将来 JSZip などの導入を検討してください。

## 5. テスト方法

### 5.1 単体テスト

```bash
npm test
```

単体テストは parser、macro parser、プレビュー補助、`.texs` archive、`.tex` export、UI 契約を対象にしています。

### 5.2 スモークテスト

```bash
npm run smoke
```

このスモークテストは、静的サーバ経由で主要アセットが取得できること、KakuTeX の主要 HTML と CSS が壊れていないこと、core roundtrip が崩れていないことを確認します。

### 5.3 LuaLaTeX 書き出し確認

`examples/exported_sample.tex` は LuaLaTeX 想定の確認用ファイルです。今回の bundle では実際に `lualatex` を実行して `examples/exported_sample.pdf` を再生成し、そのログを `docs/logs/raw/exported-sample-lualatex.log` に保存しています。仕様書 PDF は `docs/spec/spec/main.tex` から `lualatex` で再生成し、ユーザーマニュアルは Markdown から日本語 / 英語の PDF と HTML を再生成しています。

## 6. ディレクトリ概要

```text
app/
  index.html
  styles.css
  src/
  vendor/mathjax/
examples/
  body.tex
  macros.tex
  sample_note.texs
  exported_sample.tex
  exported_sample.pdf
docs/
  spec/
  user_manual/
    kakutex-user-manual-ja.pdf / .html
    kakutex-user-manual-en.pdf / .html
  admin_manual/
  logs/
  memos/
  checklists/
tests/
  unit/
  browser/
```

## 7. リリース手順の最小形

1. `npm test` を実行する。
2. `npm run smoke` を実行する。
3. `examples/exported_sample.tex` を LuaLaTeX で確認する。
4. `python3 tools/build_docs.py` を実行して仕様書 PDF、ユーザーマニュアルの日本語 / 英語 PDF と HTML、管理者向け導入マニュアル PDF / HTML を再生成する。
5. `examples/exported_sample.tex` を `lualatex` で 2 回回し、`examples/exported_sample.pdf` を更新する。
6. `app/` の内容をホームページスペースへ配置する。
7. `python3 tools/package_release.py` で全体 ZIP を作る。

## 8. バックログと既知の懸念

- 実ブラウザの visual regression を CI 相当で安定実行する仕組みは未整備です。
- `.texs` 読み込みは store-only 形式を優先しています。
- `\slashed` のプレビューは簡易実装で、完全な LaTeX 見た目一致は狙っていません。
- PDF 書き出しは現在ページに対するブラウザ印刷なので、ブラウザ差が残ります。
- `file://` 直開きは案内表示つきで編集継続できますが、数式プレビューと印刷の安定度は静的サーバ経由に劣ります。完全対応は将来の改善項目です。

## 9. 保存ダイアログ

`.texs` 保存と `.tex` 書き出しは、対応ブラウザでは File System Access API の `showSaveFilePicker()` を使います。これにより、利用者はファイル名と保存先を選べます。API が無い環境や secure context でない環境では、`download` 属性を使う通常ダウンロードへフォールバックします。

## 9. 診断の追加事項

この版では、構文解析段階で list 環境外の `\item`、素の `#`、不完全な `\frac` を検出します。さらに MathJax が `mjx-merror` を出した場合は、可能な範囲で診断欄へ反映します。


## 11. v0.0.1 で公開する UI 機能

v0.0.1 では、Undo ボタン、入力補助 / シンプルのトグル、数式 / 分数 / 和 / 積分のスニペット挿入を app 側へ反映しています。`ui.json` には `locale` と `inputAssist` を保存します。
