import re

_SEP = '-'


def _slug(value, separator=_SEP):
    """核心 slug 规则：仅将「空格」替换为分隔符，其余字符（含 CJK、字母、数字、标点、大小写）
    原样保留，保证锚点 = 标题可视文本，肉眼可对照、链接可直写。

    此函数同时服务于标题 id 生成（_slugify.py）与正文 fragment 规整（_slugify_links.py），
    确保两者规则永远一致。
    """
    if not value:
        return ''
    slug = value.strip().replace(' ', separator)
    slug = re.sub(re.escape(separator) + '+', separator, slug).strip(separator)
    return slug


def _make_slugify(separator=_SEP):
    def slugify(value, separator=_SEP):
        return _slug(value, separator)
    return slugify


def on_config(config):
    """用自定义 slugify 覆盖 toc 扩展的锚点生成规则。

    目标：让锚点与标题文本完全一致，肉眼可对照、链接可直写。

    规则：仅把「空格」替换为「-」，其余字符（中英文混排、标点、大小写、数字）
    一律原样保留，不做小写化、不做 NFC、不删标点。

    示例：
      工具链toolchain配置        -> 工具链toolchain配置   （中英文混排不补「-」）
      安装 HiSpark Studio 插件   -> 安装-HiSpark-Studio-插件
      二、FlashBoot             -> 二、FlashBoot         （标点原样保留）
    """
    mdx = config.get('mdx_configs')
    if isinstance(mdx, dict) and isinstance(mdx.get('toc'), dict):
        mdx['toc']['slugify'] = _make_slugify('-')
    return config
