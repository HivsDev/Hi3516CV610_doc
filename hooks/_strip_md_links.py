import re


def on_page_markdown(markdown, page, config, files):
    """去除IDP导出的文档中指向.md文件的a标签，只保留文本内容"""
    pattern = re.compile(
        r'<a\s+[^>]*?href=(["\'])[^"\']*\.md[^"\']*\1[^>]*>(.*?)</a>',
        re.IGNORECASE
    )
    return pattern.sub(r'\2', markdown)