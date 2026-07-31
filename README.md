# 文档网站模板

这是一个基于 MkDocs 的文档网站模板，适用于芯片/SDK 类产品的开发者中心。

## 目录结构

```
docs/
├── zh-CN/                         # 默认语言 — 中文文档
│   ├── index.md                   # 首页（概览）
│   ├── overall-architecture/      # 整体架构
│   ├── get-started/               # 快速入门
│   ├── samples/                   # 参考案例
│   ├── api-reference/             # API 参考
│   │   ├── driver/                # 驱动 API
│   │   ├── middleware/            # 中间件 API
│   │   └── osal/                  # OS 抽象层 API
│   ├── tools/                     # 工具中心
│   ├── FAQ/                       # 常见问题
│   └── others/                    # 其他（版本说明、贡献指南、术语）
└── en-US/                         # 英文语言（待添加）
```

## 导航结构

导航栏包含以下主要章节：

| 章节 | 说明 |
|------|------|
| 概览 | 首页，芯片介绍、关键参数、开发流程指引 |
| 整体架构 | 软件架构、目录结构、构建系统、内核、启动流程、运行时架构、内存布局 |
| 快速入门 | 开发板选型、环境搭建、快速开始 |
| 参考案例 | 无线连接、外设驱动、RTOS 基础、网络协议、系统服务 |
| API 参考 | 驱动 API、中间件 API、OS 抽象层 API |
| 工具中心 | IDE 插件、烧写工具 |
| FAQ | 常见问题与解答 |
| 其他 | 版本说明、贡献指南、术语汇总 |

## 使用方法

### 1. 替换占位符

将所有 `[CHIP_NAME]` 替换为你的芯片名称，`[Your Company]` 替换为公司名称，`[Your Brand]` 替换为品牌名称。

```bash
# Windows PowerShell
Get-ChildItem -Recurse -Include "*.md","*.yml" | ForEach-Object {
    (Get-Content $_.FullName) -replace '\[CHIP_NAME\]', 'MyChip' |
        Set-Content $_.FullName
}
```

### 2. 拉取 tools 子仓

模板依赖 tools 子仓提供主题、样式和基础配置：

```bash
git submodule add https://gitcode.com/HiSparkDocs/tools.git tools
git submodule update --init --recursive --remote tools
```

### 3. 构建文档

```bash
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
mkdocs build    # 输出到 site/
mkdocs serve    # 本地预览 http://127.0.0.1:8000
```

## 自定义配置

编辑 `mkdocs.yml` 修改站点名称、URL、仓库地址等：

- `site_name`: 站点名称
- `site_url`: 正式部署 URL
- `repo_url`: Git 仓库地址
- `extra.version_selector`: 版本选择器配置
- `copyright`: 版权声明

## 许可证

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)