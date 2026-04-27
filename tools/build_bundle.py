from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'app' / 'src'
OUT = ROOT / 'app' / 'app.bundle.js'
ENTRY = './main.js'

IMPORT_RE = re.compile(r"^\s*import\s*\{\s*([^}]+)\s*\}\s*from\s*'([^']+)';\s*$", re.M)
IMPORT_TARGET_RE = re.compile(r"^\s*import\s*\{[^}]+\}\s*from\s*'([^']+)';\s*$", re.M)
EXPORT_CONST_RE = re.compile(r"^\s*export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)", re.M)
EXPORT_FUNC_RE = re.compile(r"^\s*export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)", re.M)
EXPORT_CLASS_RE = re.compile(r"^\s*export\s+class\s+([A-Za-z_$][\w$]*)", re.M)


def read_module_text(module_id: str) -> str:
    if not module_id.startswith('./'):
        raise ValueError(f'Unsupported module id: {module_id}')
    path = SRC / module_id[2:]
    return path.read_text(encoding='utf-8')


def resolve_module_id(source_id: str, target: str) -> str:
    if not target.startswith('./'):
        raise ValueError(f'Unsupported import target: {target}')
    source_path = SRC / source_id[2:]
    resolved = (source_path.parent / target).resolve().relative_to(SRC.resolve())
    return f'./{resolved.as_posix()}'


def collect_reachable_modules(entry_id: str) -> list[str]:
    seen: set[str] = set()
    order: list[str] = []

    def visit(module_id: str) -> None:
        if module_id in seen:
            return
        seen.add(module_id)
        text = read_module_text(module_id)
        for target in IMPORT_TARGET_RE.findall(text):
            visit(resolve_module_id(module_id, target))
        order.append(module_id)

    visit(entry_id)
    return sorted(order)


def transform_module(module_id: str) -> tuple[str, list[str]]:
    code = read_module_text(module_id)

    def repl_import(match: re.Match[str]) -> str:
        raw_specs = match.group(1)
        target = resolve_module_id(module_id, match.group(2))
        parts = []
        for item in raw_specs.split(','):
            spec = item.strip()
            if not spec:
                continue
            if ' as ' in spec:
                exported, local = [part.strip() for part in spec.split(' as ', 1)]
                parts.append(f'{exported}: {local}')
            else:
                parts.append(spec)
        return f"const {{ {', '.join(parts)} }} = __load('{target}');"

    code = IMPORT_RE.sub(repl_import, code)
    exports: list[str] = []

    def repl_export_const(match: re.Match[str]) -> str:
        kind, name = match.group(1), match.group(2)
        exports.append(name)
        return f'{kind} {name}'

    def repl_export_func(match: re.Match[str]) -> str:
        async_kw, name = match.group(1) or '', match.group(2)
        exports.append(name)
        return f'{async_kw}function {name}'

    def repl_export_class(match: re.Match[str]) -> str:
        name = match.group(1)
        exports.append(name)
        return f'class {name}'

    code = EXPORT_CONST_RE.sub(repl_export_const, code)
    code = EXPORT_FUNC_RE.sub(repl_export_func, code)
    code = EXPORT_CLASS_RE.sub(repl_export_class, code)

    if re.search(r'^\s*export\s+', code, re.M):
        raise ValueError(f'Unhandled export syntax in {module_id}')

    return code, exports


def build_bundle(module_ids: list[str]) -> str:
    pieces = [
        '(function () {',
        "  'use strict';",
        '  const __cache = Object.create(null);',
        '  const __factories = Object.create(null);',
        '  function __load(id) {',
        '    if (Object.prototype.hasOwnProperty.call(__cache, id)) return __cache[id];',
        '    const factory = __factories[id];',
        "    if (!factory) throw new Error(`Unknown module: ${id}`);",
        '    const exports = factory(__load);',
        '    __cache[id] = exports;',
        '    return exports;',
        '  }'
    ]

    for module_id in module_ids:
        code, exports = transform_module(module_id)
        pieces.append(f"  __factories['{module_id}'] = function (__load) {{")
        pieces.append(code.rstrip())
        export_map = ', '.join(f'{name}: {name}' for name in exports)
        pieces.append(f'    return {{ {export_map} }};')
        pieces.append('  };')

    pieces.append(f"  __load('{ENTRY}');")
    pieces.append('}());')
    return '\n'.join(pieces) + '\n'


def main() -> None:
    module_ids = collect_reachable_modules(ENTRY)
    OUT.write_text(build_bundle(module_ids), encoding='utf-8')
    print(OUT)


if __name__ == '__main__':
    main()
