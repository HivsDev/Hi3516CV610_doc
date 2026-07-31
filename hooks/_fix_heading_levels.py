import re


def on_page_markdown(markdown, page, config, files):
    """修复标题级别问题，针对IDP导出的文档有多个一级标题的场景"""
    h1_count = len(re.findall(r'^# ', markdown, re.MULTILINE))
    if h1_count <= 1:
        return markdown

    lines = markdown.split('\n')
    result = []

    for line in lines:
        if line.startswith('# '):
            result.append('##' + line[1:])
        elif line.startswith('## '):
            result.append('###' + line[2:])
        elif line.startswith('### '):
            result.append('####' + line[3:])
        elif line.startswith('#### '):
            result.append('#####' + line[4:])
        elif line.startswith('##### '):
            result.append('######' + line[5:])
        else:
            result.append(line)

    new_h1 = page.title if page and page.title else ''
    if not new_h1:
        first_h1_match = re.search(r'^# (.+)', markdown, re.MULTILINE)
        new_h1 = first_h1_match.group(1).strip() if first_h1_match else ''

    if new_h1:
        result.insert(0, '# ' + new_h1)

    return '\n'.join(result)