"""自动从源页面生成主页 index.md

读取配置的源页面并生成索引页面，同时调整相对路径，使源页面内容作为网站主页提供服务。


示例配置（在 mkdocs.yml 的 extra 部分中）：
```yaml
extra:
  homepage_generator:
    source: zh_CN/HiDiTingV100/overview/README.md   # 必需
    target: zh_CN/index.md                            # 必需
```

单一事实来源：仅编辑源页面；此钩子在每次构建时自动保持主页同步。
"""

import re
from pathlib import Path, PurePosixPath
from os.path import relpath


def _rewrite_relative_links(content, src_rel, dst_rel):
    """Rewrite relative Markdown links/image refs from src to dst location."""
    src_dir = PurePosixPath(src_rel).parent   # e.g. zh_CN/HiDiTingV100/overview
    dst_dir = PurePosixPath(dst_rel).parent   # e.g. zh_CN

    def _replacer(match):
        url = match.group(2)  # the URL part inside (...)
        # Skip absolute / external links
        if re.match(r'^(https?://|/|#|mailto:|tel:)', url):
            return match.group(0)
        # Resolve url from src_dir, then compute relative path from dst_dir
        resolved = (src_dir / url)
        resolved = PurePosixPath(resolved.as_posix())
        # Normalize (resolve .. and .)
        parts = []
        for p in resolved.parts:
            if p == '..':
                if parts and parts[-1] != '..':
                    parts.pop()
                else:
                    parts.append(p)
            elif p == '.':
                continue
            else:
                parts.append(p)
        resolved_str = '/'.join(parts) if parts else '.'

        # Compute relative path from dst_dir to resolved
        new_url = relpath(resolved_str, str(dst_dir)).replace('\\', '/')

        # Rebuild: prefix + new_url + suffix
        return match.group(1) + new_url + match.group(3)

    # Match [text](url) and ![alt](url) — groups: (prefix_including_open_paren)(url)(close_paren)
    pattern = r'(!?\[[^\]]*\]\()(.*?)(\))'
    return re.sub(pattern, _replacer, content)


def on_pre_build(config, **kwargs):
    extra = config.get('extra', {})
    cfg = extra.get('homepage_generator')
    if not cfg:
        return

    src_rel = cfg.get('source')
    dst_rel = cfg.get('target')
    if not src_rel or not dst_rel:
        print("[homepage] extra.homepage_generator 缺少 source 或 target，跳过")
        return

    docs_dir = Path(config['docs_dir'])
    src = docs_dir / src_rel
    dst = docs_dir / dst_rel

    if not src.exists():
        print(f"[homepage] 源文件不存在: {src}")
        return

    content = src.read_text(encoding='utf-8')
    content = _rewrite_relative_links(content, src_rel, dst_rel)

    # Avoid unnecessary writes that could trigger mkdocs serve rebuild loops
    if dst.exists() and dst.read_text(encoding='utf-8') == content:
        return

    dst.write_text(content, encoding='utf-8')


def on_page_context(context, page, config, **kwargs):
    """Override edit URL for the generated homepage to point to the source file."""
    extra = config.get('extra', {})
    cfg = extra.get('homepage_generator')
    if not cfg:
        return

    dst_rel = cfg.get('target')
    src_rel = cfg.get('source')
    if not dst_rel or not src_rel:
        return

    # i18n plugin may prefix locale to the file path; compare the src_path part
    src_path = page.file.src_path.replace('\\', '/')
    if src_path == dst_rel:
        # Rebuild edit URL pointing to the source file
        repo_url = config.get('repo_url', '').rstrip('/')
        edit_uri = config.get('edit_uri', '').rstrip('/')
        if repo_url and edit_uri:
            page.edit_url = f"{repo_url}/{edit_uri}/{src_rel}"
