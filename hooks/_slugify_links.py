import importlib.util
import os
import re

# 复用 _slugify.py 的 slug 规则，保证「标题 id 生成」与「正文 fragment 规整」永远一致。
# MkDocs 用 importlib 单独加载每个 hook 文件，hooks 目录不在 sys.path 中，
# 因此不能用 `from hooks._slugify import _slug`，需按文件路径动态加载同目录模块。
_slugify_util = importlib.util.spec_from_file_location(
    '_slugify_util',
    os.path.join(os.path.dirname(__file__), '_slugify.py'),
)
_slugify_mod = importlib.util.module_from_spec(_slugify_util)
_slugify_util.loader.exec_module(_slugify_mod)
_slug = _slugify_mod._slug


# 匹配 markdown 链接 [text](target)，排除图片 ![...]
# target 形如：#frag / path.md#frag / path.md / http://...
_LINK_RE = re.compile(r'(?<!!)\[([^\]]*)\]\(([^)]+)\)')


def _normalize_target(target):
    """对带 #fragment 的链接目标，按 slug 规则规整 fragment，其余原样。

    - 无 fragment（无 #）：原样返回。
    - 纯外部链接（http/https/mailto/ftp）：原样返回。
    - fragment 为空（如 file.md#）：原样返回。
    - 否则：把 fragment 套用 _slug（与标题 id 生成同一规则）。
    """
    target = target.strip()
    # 去掉可选的 <title> 附注：path "title" 或 path <title>
    # 这里只处理最常见的 path#frag，title 附注极少见，保持简单
    if '#' not in target:
        return target
    path_part, frag = target.split('#', 1)
    frag = frag.strip()
    if not frag:
        return target
    new_frag = _slug(frag)
    return '#'.join([path_part, new_frag])


def on_page_markdown(markdown, page, config, files):
    """自动规整正文里 [text](#xxx) / [text](file.md#xxx) 的锚点 fragment。

    与 hooks/_slugify.py 的标题 id 生成规则共享同一 _slug 函数，
    保证「标题 id」与「正文 fragment」永远一致——手写 #安装 Git 会自动变成 #安装-Git。

    规整规则：仅 fragment 部分套用 _slug（空格→「-」，其余原样保留），
    链接文本、文件路径、显式 id（如 #uapi_adc_init 无空格，slugify 后不变）均不受影响。
    """
    lines = markdown.split('\n')
    in_code = False
    out = []
    for line in lines:
        # 跳过围栏代码块内容
        stripped = line.lstrip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            in_code = not in_code
            out.append(line)
            continue
        if in_code:
            out.append(line)
            continue

        def _sub(m):
            text, target = m.group(1), m.group(2)
            return '[%s](%s)' % (text, _normalize_target(target))

        out.append(_LINK_RE.sub(_sub, line))
    return '\n'.join(out)
