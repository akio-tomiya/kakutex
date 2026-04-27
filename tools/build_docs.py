from __future__ import annotations

import argparse
import html
import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate

ROOT = Path(__file__).resolve().parents[1]
RAW_LOG_DIR = ROOT / 'docs' / 'logs' / 'raw'
SPEC_DIR = ROOT / 'docs' / 'spec'
SPEC_VERSION = 'v1.5'
SPEC_PDF = SPEC_DIR / 'dist' / f'kakutex-spec-{SPEC_VERSION}.pdf'
SPEC_TEX = SPEC_DIR / 'spec' / 'main.tex'
SPEC_MD = SPEC_DIR / f'kakutex-spec-{SPEC_VERSION}.md'
USER_MANUAL_DIR = ROOT / 'docs' / 'user_manual'
ADMIN_MANUAL_DIR = ROOT / 'docs' / 'admin_manual'
EXAMPLES_DIR = ROOT / 'examples'
EXPORTED_SAMPLE_TEX = EXAMPLES_DIR / 'exported_sample.tex'
EXPORTED_SAMPLE_PDF = EXAMPLES_DIR / 'exported_sample.pdf'
SAMPLE_PDF_STATUS = EXAMPLES_DIR / 'sample_pdf_status.txt'


@dataclass
class MarkdownBlock:
    kind: str
    text: str
    level: int = 0
    bullet: str | None = None


INLINE_CODE_RE = re.compile(r'`([^`]+)`')
ORDERED_RE = re.compile(r'^(\d+)\.\s+(.*)$')
NON_ALNUM_RE = re.compile(r'[^a-z0-9]+')

USER_MANUAL_ANCHORS = {
    'ja': {
        '2.1 ローカル起動': 'local-startup',
        '4. 基本操作': 'basic-operations',
        '6. 対応している TeX サブセット': 'supported-tex-subset',
        '10. 既知の制限': 'known-limitations',
        '11. 免責事項': 'disclaimer',
    },
    'en': {
        '2.1 Local startup': 'local-startup',
        '4. Basic operations': 'basic-operations',
        '6. Supported TeX subset': 'supported-tex-subset',
        '10. Known limitations': 'known-limitations',
        '11. Disclaimer': 'disclaimer',
    },
}


def ensure_fonts() -> None:
    for name in ('HeiseiMin-W3', 'HeiseiKakuGo-W5'):
        try:
            pdfmetrics.getFont(name)
        except KeyError:
            pdfmetrics.registerFont(UnicodeCIDFont(name))



def make_styles() -> StyleSheet1:
    ensure_fonts()
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='KTitle', parent=styles['Title'], fontName='HeiseiKakuGo-W5', fontSize=20,
        leading=25, textColor=HexColor('#16324f'), spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        name='KHeading1', parent=styles['Heading1'], fontName='HeiseiKakuGo-W5', fontSize=16,
        leading=21, textColor=HexColor('#16324f'), spaceBefore=12, spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='KHeading2', parent=styles['Heading2'], fontName='HeiseiKakuGo-W5', fontSize=13,
        leading=18, textColor=HexColor('#16324f'), spaceBefore=10, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='KHeading3', parent=styles['Heading3'], fontName='HeiseiKakuGo-W5', fontSize=11.5,
        leading=16, textColor=HexColor('#16324f'), spaceBefore=8, spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name='KBody', parent=styles['BodyText'], fontName='HeiseiMin-W3', fontSize=10.2,
        leading=15.5, textColor=HexColor('#1f2937'), spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='KBullet', parent=styles['BodyText'], fontName='HeiseiMin-W3', fontSize=10.2,
        leading=15.5, textColor=HexColor('#1f2937'), leftIndent=12, firstLineIndent=0, spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name='KCode', parent=styles['Code'], fontName='HeiseiKakuGo-W5', fontSize=8.8, leading=12.0,
        backColor=HexColor('#f6f8fa'), borderPadding=6, borderWidth=0.4, borderColor=HexColor('#d7dde5'),
        spaceBefore=4, spaceAfter=8
    ))
    return styles



def inline_markup_pdf(text: str) -> str:
    escaped = html.escape(text)
    return INLINE_CODE_RE.sub(lambda m: f'<font name="HeiseiKakuGo-W5">{html.escape(m.group(1))}</font>', escaped)



def inline_markup_html(text: str) -> str:
    escaped = html.escape(text)
    return INLINE_CODE_RE.sub(lambda m: f'<code>{html.escape(m.group(1))}</code>', escaped)



def parse_markdown(text: str) -> List[MarkdownBlock]:
    lines = text.splitlines()
    blocks: List[MarkdownBlock] = []
    paragraph: List[str] = []
    in_code = False
    code_lines: List[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            blocks.append(MarkdownBlock('paragraph', ' '.join(part.strip() for part in paragraph if part.strip())))
            paragraph = []

    def flush_code() -> None:
        nonlocal code_lines
        blocks.append(MarkdownBlock('code', '\n'.join(code_lines).rstrip('\n')))
        code_lines = []

    for line in lines:
        if line.strip().startswith('```'):
            flush_paragraph()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
                code_lines = []
            continue
        if in_code:
            code_lines.append(line)
            continue
        stripped = line.rstrip()
        if not stripped:
            flush_paragraph()
            continue
        if stripped.startswith('#'):
            flush_paragraph()
            level = len(stripped) - len(stripped.lstrip('#'))
            title = stripped[level:].strip()
            blocks.append(MarkdownBlock('heading', title, level=level))
            continue
        if stripped.startswith('- '):
            flush_paragraph()
            blocks.append(MarkdownBlock('bullet', stripped[2:].strip(), bullet='•'))
            continue
        match = ORDERED_RE.match(stripped)
        if match:
            flush_paragraph()
            blocks.append(MarkdownBlock('bullet', match.group(2).strip(), bullet=f'{match.group(1)}.'))
            continue
        paragraph.append(stripped)

    flush_paragraph()
    if in_code:
        flush_code()
    return blocks



def header_footer(title: str):
    def draw(canvas, doc):
        canvas.saveState()
        canvas.setFont('HeiseiKakuGo-W5', 9)
        canvas.setFillColor(HexColor('#16324f'))
        canvas.drawString(doc.leftMargin, A4[1] - 12 * mm, title)
        canvas.setFont('HeiseiMin-W3', 8.5)
        canvas.setFillColor(HexColor('#5b6475'))
        canvas.drawRightString(A4[0] - doc.rightMargin, 10 * mm, f'{canvas.getPageNumber()}')
        canvas.restoreState()
    return draw



def markdown_to_pdf(src: Path, dest: Path, title_override: str | None = None) -> None:
    styles = make_styles()
    blocks = parse_markdown(src.read_text(encoding='utf-8'))
    title = title_override or next((b.text for b in blocks if b.kind == 'heading' and b.level == 1), src.stem)
    story = []
    first_heading_seen = False
    for block in blocks:
        if block.kind == 'heading':
            if block.level == 1 and not first_heading_seen:
                style = styles['KTitle']
                first_heading_seen = True
            elif block.level == 2:
                style = styles['KHeading1']
            elif block.level == 3:
                style = styles['KHeading2']
            else:
                style = styles['KHeading3']
            story.append(Paragraph(inline_markup_pdf(block.text), style))
            continue
        if block.kind == 'code':
            story.append(Preformatted(block.text, styles['KCode']))
            continue
        if block.kind == 'bullet':
            story.append(Paragraph(inline_markup_pdf(block.text), styles['KBullet'], bulletText=block.bullet))
            continue
        story.append(Paragraph(inline_markup_pdf(block.text), styles['KBody']))
    dest.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(dest), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=16 * mm, title=title)
    doc.build(story, onFirstPage=header_footer(title), onLaterPages=header_footer(title))



def slugify(text: str) -> str:
    lowered = text.casefold()
    slug = NON_ALNUM_RE.sub('-', lowered).strip('-')
    return slug



def heading_id(text: str, locale: str, seen: set[str]) -> str:
    candidate = USER_MANUAL_ANCHORS.get(locale, {}).get(text, '')
    if not candidate:
        candidate = slugify(text)
    if not candidate:
        candidate = f'section-{len(seen) + 1}'
    base = candidate
    suffix = 2
    while candidate in seen:
        candidate = f'{base}-{suffix}'
        suffix += 1
    seen.add(candidate)
    return candidate



def build_nav_html(lead: str, links: list[tuple[str, str]]) -> str:
    items = ''.join(
        f'<a class="manual-chip" href="{html.escape(href)}"'
        + (' target="_blank" rel="noopener noreferrer"' if href.endswith('.pdf') else '')
        + f'>{html.escape(label)}</a>'
        for label, href in links
    )
    return f'<div class="manual-nav"><p class="manual-lead">{html.escape(lead)}</p><div class="manual-chip-row">{items}</div></div>'


def manual_nav(locale: str, pdf_href: str) -> str:
    if locale == 'ja':
        return build_nav_html(
            'この HTML 版は Markdown から自動生成しています。PDF 版も同じ原稿から作っています。',
            [
                ('基本操作', '#basic-operations'),
                ('対応構文', '#supported-tex-subset'),
                ('既知の制限', '#known-limitations'),
                ('免責事項', '#disclaimer'),
                ('PDF 版を開く', pdf_href),
            ],
        )
    return build_nav_html(
        'This HTML manual is generated from the same Markdown source as the PDF manual.',
        [
            ('Basic operations', '#basic-operations'),
            ('Supported subset', '#supported-tex-subset'),
            ('Known limitations', '#known-limitations'),
            ('Disclaimer', '#disclaimer'),
            ('Open PDF', pdf_href),
        ],
    )



def markdown_to_html(src: Path, dest: Path, *, title_override: str | None = None, locale: str = 'ja', pdf_name: str, nav_html: str | None = None) -> None:
    blocks = parse_markdown(src.read_text(encoding='utf-8'))
    title = title_override or next((b.text for b in blocks if b.kind == 'heading' and b.level == 1), src.stem)
    seen_ids: set[str] = set()
    parts = [
        '<!doctype html>',
        f'<html lang="{html.escape(locale)}">',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        f'  <title>{html.escape(title)}</title>',
        '  <style>',
        '    :root { --bg: #f6f7fb; --card: #ffffff; --line: #d7dde5; --ink: #1f2937; --muted: #5b6475; --accent: #16324f; --soft: #eef3ff; }',
        '    * { box-sizing: border-box; }',
        '    body { margin: 0; font-family: "Inter", "Noto Sans JP", system-ui, sans-serif; color: var(--ink); background: linear-gradient(180deg, #f6f7fb 0%, #eef3ff 100%); }',
        '    .page { max-width: 960px; margin: 0 auto; padding: 24px 18px 44px; }',
        '    .manual-card { background: rgba(255,255,255,0.95); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,0.08); overflow: hidden; }',
        '    .manual-header { padding: 22px 24px 16px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }',
        '    .manual-header h1 { margin: 0; font-size: 1.8rem; color: var(--accent); }',
        '    .manual-nav { margin-top: 14px; display: grid; gap: 10px; }',
        '    .manual-lead { margin: 0; color: var(--muted); font-size: 0.95rem; }',
        '    .manual-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }',
        '    .manual-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 12px; border: 1px solid #b6c0d4; border-radius: 999px; text-decoration: none; color: var(--ink); background: #ffffff; }',
        '    .manual-body { padding: 20px 24px 30px; }',
        '    h1, h2, h3, h4 { color: var(--accent); scroll-margin-top: 16px; }',
        '    h2 { margin: 1.2em 0 0.55em; font-size: 1.32rem; }',
        '    h3 { margin: 1.05em 0 0.45em; font-size: 1.08rem; }',
        '    h4 { margin: 0.95em 0 0.38em; font-size: 0.98rem; }',
        '    p { margin: 0 0 0.75em; line-height: 1.72; }',
        '    ul, ol { margin: 0.2em 0 0.9em 1.4em; padding: 0; }',
        '    li { margin: 0.2em 0; line-height: 1.68; }',
        '    pre { margin: 0.4em 0 1em; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: #f6f8fa; overflow: auto; font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.92rem; line-height: 1.5; }',
        '    code { font-family: "SFMono-Regular", Consolas, monospace; background: #eef2ff; border-radius: 6px; padding: 0.1em 0.35em; }',
        '    @media (max-width: 720px) { .page { padding: 14px 12px 28px; } .manual-header, .manual-body { padding-left: 16px; padding-right: 16px; } }',
        '  </style>',
        '</head>',
        '<body>',
        '  <div class="page">',
        '    <article class="manual-card">',
        '      <header class="manual-header">',
        f'        <h1>{html.escape(title)}</h1>',
        f'        {nav_html or manual_nav(locale, pdf_name)}',
        '      </header>',
        '      <div class="manual-body">',
    ]
    i = 0
    while i < len(blocks):
        block = blocks[i]
        if block.kind == 'heading':
            level = 1 if block.level <= 1 else min(block.level, 4)
            tag = f'h{level}'
            anchor = heading_id(block.text, locale, seen_ids)
            parts.append(f'        <{tag} id="{html.escape(anchor)}">{inline_markup_html(block.text)}</{tag}>')
            i += 1
            continue
        if block.kind == 'paragraph':
            parts.append(f'        <p>{inline_markup_html(block.text)}</p>')
            i += 1
            continue
        if block.kind == 'code':
            parts.append(f'        <pre><code>{html.escape(block.text)}</code></pre>')
            i += 1
            continue
        if block.kind == 'bullet':
            ordered = bool(block.bullet and block.bullet.endswith('.'))
            if ordered:
                start = int(block.bullet[:-1]) if block.bullet[:-1].isdigit() else 1
                parts.append(f'        <ol start="{start}">')
            else:
                parts.append('        <ul>')
            while i < len(blocks) and blocks[i].kind == 'bullet' and bool(blocks[i].bullet and blocks[i].bullet.endswith('.')) == ordered:
                parts.append(f'          <li>{inline_markup_html(blocks[i].text)}</li>')
                i += 1
            parts.append('        </ol>' if ordered else '        </ul>')
            continue
        i += 1
    parts.extend([
        '      </div>',
        '    </article>',
        '  </div>',
        '</body>',
        '</html>',
    ])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text('\n'.join(parts) + '\n', encoding='utf-8')



def write_log(log_name: str, lines: Iterable[str]) -> None:
    RAW_LOG_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_LOG_DIR / log_name).write_text('\n'.join(lines) + '\n', encoding='utf-8')



def run_logged(cmd: list[str], *, cwd: Path, log_path: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True)
    with log_path.open('a', encoding='utf-8') as log:
        log.write('$ ' + ' '.join(cmd) + '\n')
        log.write(proc.stdout)
        log.write(proc.stderr)
        if proc.returncode != 0:
            log.write(f'\n[exit code] {proc.returncode}\n')
    return proc



def build_spec_pdf() -> str:
    SPEC_DIR.joinpath('build').mkdir(parents=True, exist_ok=True)
    SPEC_DIR.joinpath('dist').mkdir(parents=True, exist_ok=True)
    lualatex = shutil.which('lualatex')
    if lualatex:
        build_dir = SPEC_DIR / 'build'
        env = dict(os.environ)
        env['TEXMFOUTPUT'] = str(build_dir)
        log_path = RAW_LOG_DIR / 'kakutex-spec-build.log'
        log_path.write_text('', encoding='utf-8')
        cmds = [
            [lualatex, '-interaction=nonstopmode', '-halt-on-error', '-output-directory', str(build_dir), str(SPEC_TEX)],
            [lualatex, '-interaction=nonstopmode', '-halt-on-error', '-output-directory', str(build_dir), str(SPEC_TEX)],
        ]
        for cmd in cmds:
            proc = run_logged(cmd, cwd=SPEC_DIR, log_path=log_path, env=env)
            if proc.returncode != 0:
                raise RuntimeError(f'Spec build failed: {cmd}')
        pdf = build_dir / 'main.pdf'
        if not pdf.exists():
            raise FileNotFoundError(pdf)
        SPEC_PDF.write_bytes(pdf.read_bytes())
        return 'lualatex'

    build_dir = SPEC_DIR / 'build'
    for stale in build_dir.iterdir():
        if stale.name == 'BUILD_NOT_RUN.txt':
            continue
        if stale.is_file():
            stale.unlink()
    markdown_to_pdf(SPEC_MD, SPEC_PDF, title_override='KakuTeX 仕様書 v1.5')
    write_log('kakutex-spec-build.log', [
        'lualatex was not found in this environment.',
        f'Generated {SPEC_PDF.relative_to(ROOT)} from markdown mirror {SPEC_MD.relative_to(ROOT)}.',
        f'TeX source kept at {SPEC_TEX.relative_to(ROOT)}.',
        f'Cleaned stale artifacts under {build_dir.relative_to(ROOT)} except BUILD_NOT_RUN.txt.',
    ])
    return 'markdown-fallback'



def build_manuals() -> list[str]:
    outputs: list[str] = []
    manuals = [
        {
            'locale': 'ja',
            'src': USER_MANUAL_DIR / 'kakutex-user-manual.md',
            'pdf': USER_MANUAL_DIR / 'kakutex-user-manual-ja.pdf',
            'html': USER_MANUAL_DIR / 'kakutex-user-manual-ja.html',
            'title': 'KakuTeX ユーザーマニュアル',
            'log': 'kakutex-user-manual-ja-build.log',
        },
        {
            'locale': 'en',
            'src': USER_MANUAL_DIR / 'kakutex-user-manual-en.md',
            'pdf': USER_MANUAL_DIR / 'kakutex-user-manual-en.pdf',
            'html': USER_MANUAL_DIR / 'kakutex-user-manual-en.html',
            'title': 'KakuTeX User Manual',
            'log': 'kakutex-user-manual-en-build.log',
        },
    ]
    for item in manuals:
        markdown_to_pdf(item['src'], item['pdf'], title_override=item['title'])
        markdown_to_html(item['src'], item['html'], title_override=item['title'], locale=item['locale'], pdf_name=item['pdf'].name)
        outputs.extend([str(item['pdf'].relative_to(ROOT)), str(item['html'].relative_to(ROOT))])
        write_log(item['log'], [
            f"Generated {item['pdf'].relative_to(ROOT)} from {item['src'].relative_to(ROOT)}",
            f"Generated {item['html'].relative_to(ROOT)} from {item['src'].relative_to(ROOT)}",
        ])

    legacy_pdf = USER_MANUAL_DIR / 'kakutex-user-manual.pdf'
    legacy_html = USER_MANUAL_DIR / 'kakutex-user-manual.html'
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-ja.pdf', legacy_pdf)
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-ja.html', legacy_html)
    en_dot_pdf = USER_MANUAL_DIR / 'kakutex-user-manual.en.pdf'
    en_dot_html = USER_MANUAL_DIR / 'kakutex-user-manual.en.html'
    ja_dot_pdf = USER_MANUAL_DIR / 'kakutex-user-manual.ja.pdf'
    ja_dot_html = USER_MANUAL_DIR / 'kakutex-user-manual.ja.html'
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-en.pdf', en_dot_pdf)
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-en.html', en_dot_html)
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-ja.pdf', ja_dot_pdf)
    shutil.copy2(USER_MANUAL_DIR / 'kakutex-user-manual-ja.html', ja_dot_html)
    outputs.extend([
        str(legacy_pdf.relative_to(ROOT)), str(legacy_html.relative_to(ROOT)),
        str(en_dot_pdf.relative_to(ROOT)), str(en_dot_html.relative_to(ROOT)),
        str(ja_dot_pdf.relative_to(ROOT)), str(ja_dot_html.relative_to(ROOT))
    ])
    write_log('kakutex-user-manual-build.log', [
        'Generated localized user manuals (ja/en) as PDF and HTML from Markdown.',
        f'Legacy Japanese aliases: {legacy_pdf.relative_to(ROOT)}, {legacy_html.relative_to(ROOT)}',
        f'Dotted aliases: {en_dot_pdf.relative_to(ROOT)}, {en_dot_html.relative_to(ROOT)}, {ja_dot_pdf.relative_to(ROOT)}, {ja_dot_html.relative_to(ROOT)}',
    ])

    admin_src = ADMIN_MANUAL_DIR / 'kakutex-admin-manual.md'
    admin_pdf = ADMIN_MANUAL_DIR / 'kakutex-admin-manual.pdf'
    admin_html = ADMIN_MANUAL_DIR / 'kakutex-admin-manual.html'
    markdown_to_pdf(admin_src, admin_pdf, title_override='KakuTeX 管理者向け導入マニュアル')
    admin_nav = build_nav_html('この HTML 版も同じ Markdown 原稿から自動生成しています。', [('PDF 版を開く', admin_pdf.name)])
    markdown_to_html(admin_src, admin_html, title_override='KakuTeX 管理者向け導入マニュアル', locale='ja', pdf_name=admin_pdf.name, nav_html=admin_nav)
    outputs.extend([str(admin_pdf.relative_to(ROOT)), str(admin_html.relative_to(ROOT))])
    write_log('kakutex-admin-manual-build.log', [
        f'Generated {admin_pdf.relative_to(ROOT)} from {admin_src.relative_to(ROOT)}',
        f'Generated {admin_html.relative_to(ROOT)} from {admin_src.relative_to(ROOT)}',
    ])
    return outputs



def build_sample_pdf() -> str:
    lualatex = shutil.which('lualatex')
    log_path = RAW_LOG_DIR / 'exported-sample-lualatex.log'
    if not lualatex:
        SAMPLE_PDF_STATUS.write_text('lualatex was not available; exported_sample.pdf was not regenerated.\n', encoding='utf-8')
        write_log('exported-sample-lualatex.log', ['lualatex was not found in this environment.'])
        return 'unavailable'

    log_path.write_text('', encoding='utf-8')
    cmds = [
        [lualatex, '-interaction=nonstopmode', '-halt-on-error', '-output-directory', str(EXAMPLES_DIR), str(EXPORTED_SAMPLE_TEX)],
        [lualatex, '-interaction=nonstopmode', '-halt-on-error', '-output-directory', str(EXAMPLES_DIR), str(EXPORTED_SAMPLE_TEX)],
    ]
    env = dict(os.environ)
    env['TEXMFOUTPUT'] = str(EXAMPLES_DIR)
    for cmd in cmds:
        proc = run_logged(cmd, cwd=EXAMPLES_DIR, log_path=log_path, env=env)
        if proc.returncode != 0:
            SAMPLE_PDF_STATUS.write_text('lualatex failed while compiling examples/exported_sample.tex. See docs/logs/raw/exported-sample-lualatex.log.\n', encoding='utf-8')
            raise RuntimeError('Failed to compile examples/exported_sample.tex')
    if not EXPORTED_SAMPLE_PDF.exists():
        raise FileNotFoundError(EXPORTED_SAMPLE_PDF)
    SAMPLE_PDF_STATUS.write_text('examples/exported_sample.pdf was regenerated with lualatex.\n', encoding='utf-8')
    return 'lualatex'



def capture_tool_versions() -> None:
    versions = {
        'python-version.txt': subprocess.run(['python3', '--version'], capture_output=True, text=True).stdout.strip() or subprocess.run(['python3', '--version'], capture_output=True, text=True).stderr.strip(),
        'node-version.txt': subprocess.run(['node', '--version'], capture_output=True, text=True).stdout.strip(),
        'npm-version.txt': subprocess.run(['npm', '--version'], capture_output=True, text=True).stdout.strip(),
        'lualatex-version.txt': subprocess.run(['lualatex', '--version'], capture_output=True, text=True).stdout.splitlines()[0].strip() if shutil.which('lualatex') else 'lualatex not available',
    }
    chromium_cmd = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if chromium_cmd:
        proc = subprocess.run([chromium_cmd, '--version'], capture_output=True, text=True)
        versions['chromium-version.txt'] = proc.stdout.strip() or proc.stderr.strip()
    else:
        versions['chromium-version.txt'] = 'chromium not available in this environment'
    for name, value in versions.items():
        (RAW_LOG_DIR / name).write_text(value + '\n', encoding='utf-8')



def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--spec-only', action='store_true')
    args = parser.parse_args()
    RAW_LOG_DIR.mkdir(parents=True, exist_ok=True)
    capture_tool_versions()
    build_spec_pdf()
    if not args.spec_only:
        build_manuals()
        build_sample_pdf()


if __name__ == '__main__':
    main()
