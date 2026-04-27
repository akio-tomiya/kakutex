# KakuTeX 仕様書 v1.5

更新日: 2026-04-20

## 1. 位置付け

KakuTeX は、ブラウザだけで動く TeX サブセット・メモアプリです。左に本文ソース、右にプレビューを置き、入力停止後に右ペインを更新します。内部 LaTeX コンパイルは行いません。通常利用はネット接続下の静的ホスト公開を本線とし、同一成果物からオフライン配布 ZIP を切り出せる構成を採ります。

## 2. 非目標

- 本物の LaTeX コンパイル
- 複雑なパッケージ対応
- 図表、BibTeX、厳密なページ組版
- 文字単位の完全位置同期
- 本格的な IDE 機能

## 3. 実行形態

- 公開本体は `app/` の静的ファイル群です。
- ソースの正本は GitHub に置きます。
- 個人ホームページのサブディレクトリに置く前提で、相対パス参照を使います。
- `file://` 直開きは正式推奨ではありません。起動案内バナーで静的サーバ起動方法と HTML ヘルプへのリンクを示します。

推奨のローカル確認方法は次です。

```bash
python3 -m http.server 8000
http://127.0.0.1:8000/app/
```

## 4. 画面仕様

画面は上部メニュー、起動案内バナー、左ペイン、中央の Sync レール、右ペインで構成します。上部メニューは左に操作ボタン、右に KakuTeX の名前と版番号を置きます。版番号はボタンとしても機能し、情報ダイアログを開けます。左ペイン上段は本文、下段は新規コマンド欄です。右ペイン上段はプレビュー、下段は診断欄です。状態メッセージは下部バーへ置かず、プレビュー見出しの右側へ置きます。

デスクトップ幅では、左本文、左新規コマンド欄、右プレビュー、右診断欄がそれぞれ内部スクロールを持ちます。狭い幅では縦積みに切り替え、ページ全体スクロールに戻します。

### 4.1 メニュー

- 新規
- 開く `.texs`
- 保存 `.texs`
- 書き出し `.tex`
- 印刷 / PDF
- 情報ダイアログ
- ヘルプ
- 日本語 / 英語切替
- Undo
- 入力補助 / シンプル切替
- 入力補助スニペット挿入

### 4.2 初期言語

初回起動時の UI 言語はブラウザ言語から決め、日本語系なら日本語、それ以外は英語を既定値とします。本文の初期サンプルは UI 言語に関係なく英語で、`\slashed{D} = \gamma^\mu A_\mu` を含みます。

### 4.3 ヘルプ

ヘルプボタンは、新しいタブで現在の UI 言語に対応した HTML ユーザーマニュアルを開き、`#basic-operations` へ移動します。HTML マニュアルの先頭には対応する PDF 版へのリンクを置きます。ユーザーマニュアルは Markdown を正本とし、日本語 / 英語の HTML と PDF を同じ build から生成します。

### 4.4 起動案内バナー

`file://` で `app/index.html` を直開きした場合でも、編集画面は先に表示します。その上で、画面上部に起動案内バナーを出し、ユーザーマニュアルの「2.1 ローカル起動」と「10. 既知の制限」へ誘導します。案内バナーには次の情報を含めます。

- `python3 -m http.server 8000`
- `http://127.0.0.1:8000/app/`
- ローカル起動節へ飛ぶ HTML ヘルプへの相対リンク

## 5. 主要機能

- `.texs` 保存と読み込み
- `.tex` 書き出し
- プレビュー印刷による PDF 書き出し
- ブロック単位 Sync
- 自動退避と未保存警告
- 日本語 / 英語 UI
- 起動案内バナー
- 右プレビューの見出し番号
- 版番号、作者情報、免責事項リンクを出す情報ダイアログ
- Undo と入力補助ツールバー
- ローカライズされた HTML / PDF ヘルプ導線

## 6. TeX サブセット

### 6.1 見出し

- `\section{...}`
- `\subsection{...}`
- `\subsubsection{...}`
- `\paragraph{...}`

右プレビューでは見出し番号を自動付与します。これは視認性改善が目的であり、LaTeX の厳密な相互参照機構ではありません。`\paragraph` は run-in 見出しではなく独立した小見出しブロックとして描画します。

### 6.2 数式

インライン数式は `$...$` と `\(...\)` を扱います。ディスプレイ数式は `$$...$$`、`\[...\]`、`equation`、`equation*`、`align`、`align*`、`gather`、`gather*` を扱います。

`eqnarray` と `eqnarray*` は互換レイヤで `align` 系へ変換します。診断欄には互換表示の情報を出します。

### 6.3 リスト

- `itemize`
- `enumerate`

各 `\item` の中に段落、インライン数式、ディスプレイ数式、入れ子のリストを書けます。

### 6.4 新規コマンド

新規コマンド欄は引数なし `\newcommand` だけを扱います。代表例は次です。

```tex
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}
```

`\slashed{...}` は組み込みマクロです。初版ではユーザー定義で上書きできません。

## 7. 実装方針

### 7.1 パーサ

本物の TeX パーサは作りません。実装はブロック分割器です。見出し、段落、数式ブロック、リストを軽く識別し、未知の `\begin{...}` は未対応ブロックとして隔離します。

### 7.2 プレビュー

段落全体を MathJax に丸ごと渡すと、本文中の `\` まで巻き込まれて意図しない表示になることがあります。そのため、段落と見出しは text node と inline math span へ分解して描画し、MathJax は `inline-math-source` と `math-block-source` にだけ適用します。これにより、段落中の `\` は右ペインで明示改行として扱い、数式外の誤変換を避けます。右ペインの block 間縦余白はやや詰め、長いメモで視線が飛びすぎないようにします。

### 7.3 マクロ適用

MathJax のマクロ辞書も更新しますが、安定性のために no-argument macro を各数式断片へ前展開します。インライン数式とディスプレイ数式の両方でこの前展開を使います。これにより、`\Tr` や `\Det` のような短い演算子マクロを右ペインで安定して反映できます。

さらに、数式環境の中へ `enumerate` や `\item` のような文書用構文が入った場合は、無言で流さず parser が error 診断を出します。これにより、raw math source が見えた場面でも診断欄から原因を追えます。

加えて、list 環境の外にある `\item`、素の `#`、不完全な `\frac_` のような怪しい入力は段落段階で warning / error を出します。MathJax が `\info` のような未知コマンドや壊れた数式を検出した場合も、可能な範囲で診断欄へ反映します。初版では追加のヒューリスティック診断として、`$\info$` のような未定義コマンド、裸の `#`、不完全な `\frac_`、リスト外の `\item` も警告またはエラー候補として出します。

### 7.4 Sync

Sync は文字単位ではなくブロック単位です。中央の小型矢印ボタン `→` は左のカーソル位置から最も近い top-level block を選び、右ペインを移動します。`←` は選択中ブロックの source range へ戻ります。右ペインから左へ戻すときも block range を使います。

### 7.5 `.texs`

`.texs` は ZIP ベースのコンテナです。初版では次を格納します。

- `body.tex`
- `macros.tex`
- `ui.json`
- `meta.json`

初版の読み込みは store-only ZIP を優先します。

### 7.6 PDF 書き出し

PDF 書き出しはブラウザ印刷です。現在ページに対して `window.print()` を呼び、印刷用 CSS で右ペイン中心の表示へ切り替えます。これは LaTeX 組版の PDF ではなく、プレビュー画面の PDF 化です。

対応ブラウザかつ secure context では、`.texs` 保存と `.tex` 書き出しに `showSaveFilePicker()` を使い、ファイル名と保存先を選べるようにします。非対応環境では通常ダウンロードへフォールバックします。

## 8. 代表例

### 8.1 本文

```tex
\section{Test}
This section is a test.\\
Hard line breaks work, and inline math such as $E=mc^2$ is supported.

\subsection{Small test}
\begin{align}
\Tr M &= 0 \\
\Det A &= 1 \\
\slashed{D} &= \gamma^\mu A_\mu
\end{align}

\begin{itemize}
\item First bullet item
\item Second bullet item
\end{itemize}
```

### 8.2 マクロ

```tex
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}
```

## 9. 受入条件

- 単体テスト `npm test` が通ること。
- `examples/exported_sample.tex` が `lualatex` でコンパイルできること。
- スモークテスト `npm run smoke` が通ること。
- 静的サーバ経由で `app/` を開いたときに UI が初期化されること。
- 直開き時に起動案内バナーが残ること。
- 左右の主要パネルが内部スクロールを持つこと。
- `\Tr` と `\Det` の例がプレビューに反映されること。
- 本文中の `\\` が右ペインで `\` に化けないこと。

## 10. 既知の懸念

- 実ブラウザの visual regression は未整備です。
- `file://` 直開きの完全サポートは後続課題です。
- `\slashed` は簡易実装であり、完全な LaTeX 見た目一致は狙っていません。
- PDF 書き出しはブラウザ印刷なのでブラウザ差が残ります。
- 現在の実行環境では `lualatex` が見つからない場合があり、その場合は仕様書 PDF を markdown mirror から生成します。TeX ソース自体は常に同梱します。

## 11. ソースの所在

- 仕様書 TeX ソース: `docs/spec/spec/main.tex`
- 仕様書 markdown mirror: `docs/spec/kakutex-spec-v1.5.md`
- 仕様書 PDF: `docs/spec/dist/kakutex-spec-v1.5.pdf`
- ユーザーマニュアル: `docs/user_manual/`
  - `kakutex-user-manual.md`
  - `kakutex-user-manual-en.md`
  - `kakutex-user-manual-ja.html / .pdf`
  - `kakutex-user-manual-en.html / .pdf`
- 管理者向け導入マニュアル: `docs/admin_manual/`
- 作業ログとチェックリスト: `docs/logs/`, `docs/checklists/`, `docs/memos/`


### 7.7 Undo と入力補助

Undo は body / macros の軽量 snapshot 履歴を用います。入力補助は、`align`, `frac`, `sum`, `integral` の最小スニペットをカーソル位置へ挿入します。入力補助表示状態は `ui.json` の `inputAssist` に保存します。

### 7.8 exporter と TeX engine

`.tex` exporter は、英語だけのノートでは `luatexja` を挿入しません。日本語が検出された場合だけ LuaLaTeX 経路で `luatexja` を条件付き挿入します。`pxjahyper` は既定では入れず、利用者が (u)pLaTeX 経路で `hyperref` を足す場合の補助として扱います。

### 13.1 免責事項導線

ユーザーマニュアルには日本語版・英語版とも `#disclaimer` アンカーを持つ免責事項セクションを置く。情報ダイアログにはそのアンカーへのリンクを表示し、利用者が Help を開かなくても免責事項へ到達できるようにする。
