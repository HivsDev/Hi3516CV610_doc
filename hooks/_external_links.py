import re

# 匹配带 http(s) 外部链接的 <a> 标签。
# 「外部」定义：href 以 http:// 或 https:// 开头。
# 站内链接（相对路径、#锚点、mailto、tel 等）不匹配，天然不受影响。
# 用 [^>]*? 非贪婪逐段捕获，分别检查 href / target / rel，避免误伤。
_A_RE = re.compile(r'<a\b([^>]*?)>', re.IGNORECASE)
_HREF_RE = re.compile(r'''href\s*=\s*(["'])(https?://[^"']+)\1''', re.IGNORECASE)
_TARGET_RE = re.compile(r'''target\s*=\s*(["'])(?:[^"']*)\1''', re.IGNORECASE)
_REL_RE = re.compile(r'''rel\s*=\s*(["'])([^"']*)\1''', re.IGNORECASE)

# rel 属性必须包含的安全值（防止 target=_blank 的 window.opener 反向钓鱼）
_REQUIRED_REL = {'noopener', 'noreferrer'}


def _patch_attrs(attrs):
    """处理一个 <a ...> 的属性字符串，若是外部链接则补 target=_blank 与 rel=noopener noreferrer。

    返回处理后的属性字符串（含可能新增/补全的属性）。
    """
    hm = _HREF_RE.search(attrs)
    if not hm:
        return attrs  # 无 http(s) href，非外部链接，原样返回

    # 1. target="_blank"：已有任意 target 则不动，否则补上
    if _TARGET_RE.search(attrs):
        new_attrs = attrs
    else:
        new_attrs = attrs.rstrip() + ' target="_blank"'

    # 2. rel：确保包含 noopener noreferrer，不重复
    rm = _REL_RE.search(new_attrs)
    if rm:
        existing = set(rm.group(2).split())
        missing = _REQUIRED_REL - existing
        if missing:
            merged = ' '.join(sorted(existing | _REQUIRED_REL))
            new_attrs = new_attrs[:rm.start()] + 'rel="%s"' % merged + new_attrs[rm.end():]
    else:
        new_attrs = new_attrs.rstrip() + ' rel="noopener noreferrer"'

    return new_attrs


def on_post_page(output, page, config, **kwargs):
    """让所有外部链接（http/https）在新标签页打开，并补全 rel=noopener noreferrer。

    在 HTML 渲染完成后（on_post_page）处理，覆盖正文链接与主题模板链接（header/footer 等）。
    站内相对链接、锚点、mailto、tel 等不受影响。
    """
    return _A_RE.sub(lambda m: '<a' + _patch_attrs(m.group(1)) + '>', output)
