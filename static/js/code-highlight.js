/**
 * 代码关键词高亮 - 纯 JS 实现，不依赖 MkDocs hooks
 * 
 * 检测现有代码块渲染方式（Pygments token spans），
 * 在未高亮的文本节点中匹配自定义关键词并注入对应 CSS 类。
 * 
 * 高亮规则参考 GitCode (GitHub Primer 色值体系):
 *   .k  → 红色 #cf222e   Keyword（关键字 / CLI 命令）
 *   .nb → 蓝色 #0550ae   Name.Builtin（内置名 / 构建目标）
 *   .nf → 紫色 #8250df   Name.Function（函数 / 脚本名）
 *   .nv → 橙色 #953800   Name.Variable（环境变量 / 配置键）
 *   .s  → 深蓝 #0a3069   String（路径 / URL / 版本号）
 */

(function () {
  'use strict';

  // ========== 关键词配置（GitCode 风格多类别） ==========

  /** 自定义关键词 → CSS 类名映射 */
  var KEYWORD_MAP = {
    // === .k  红色 #cf222e — 关键字 / CLI 命令 / 构建工具 ===
    'fbb': 'k', 'hb': 'k', 'make': 'k', 'cmake': 'k', 'ninja': 'k',
    'gcc': 'k', 'g++': 'k', 'clang': 'k', 'ld': 'k', 'ar': 'k',
    'objdump': 'k', 'objcopy': 'k', 'readelf': 'k', 'size': 'k',
    'addr2line': 'k', 'strip': 'k', 'nm': 'k', 'scons': 'k', 'west': 'k',
    'pip': 'k', 'pip3': 'k', 'npm': 'k', 'npx': 'k', 'yarn': 'k',
    'pnpm': 'k', 'conda': 'k', 'apt': 'k', 'apt-get': 'k',
    'yum': 'k', 'dnf': 'k', 'brew': 'k', 'choco': 'k',
    'sudo': 'k', 'su': 'k', 'chmod': 'k', 'chown': 'k',
    'mount': 'k', 'umount': 'k', 'systemctl': 'k', 'service': 'k',
    'journalctl': 'k', 'kill': 'k', 'killall': 'k', 'ps': 'k',
    'top': 'k', 'htop': 'k', 'df': 'k', 'du': 'k', 'which': 'k',
    'whereis': 'k', 'locate': 'k', 'find': 'k', 'xargs': 'k',
    'awk': 'k', 'sed': 'k',
    'git': 'k', 'svn': 'k', 'hg': 'k',
    'curl': 'k', 'wget': 'k', 'ssh': 'k', 'scp': 'k', 'rsync': 'k',
    'ping': 'k', 'traceroute': 'k', 'netstat': 'k', 'nc': 'k',
    'nslookup': 'k', 'dig': 'k', 'ifconfig': 'k', 'ip': 'k',
    'iwconfig': 'k', 'hostnamectl': 'k',
    'python': 'k', 'python3': 'k', 'node': 'k', 'go': 'k',
    'rustc': 'k', 'cargo': 'k', 'java': 'k', 'javac': 'k',
    'mvn': 'k', 'gradle': 'k', 'docker': 'k', 'docker-compose': 'k',
    'kubectl': 'k', 'helm': 'k',

    // === .nb 蓝色 #0550ae — 内置名 / 构建目标 / 平台标识 ===
    'ws63-liteos-app': 'nb',

    // === .nf 紫色 #8250df — 函数 / 脚本 / 入口点 ===
    'app_main': 'nf', 'main': 'nf',

    // === .nv 橙色 #953800 — 环境变量 / 配置键 ===
    'PATH': 'nv', 'HOME': 'nv', 'PWD': 'nv', 'USER': 'nv',
    'CONFIG_WS63': 'nv',
  };

  /**
   * 按长度降序排列关键词，用于优先匹配长关键词（如 apt-get 优先于 apt）
   * 同时构建 Set 用于 O(1) 查找
   */
  var KEYWORDS = Object.keys(KEYWORD_MAP);
  KEYWORDS.sort(function (a, b) { return b.length - a.length; });
  var KEYWORD_SET = {};
  for (var i = 0; i < KEYWORDS.length; i++) {
    KEYWORD_SET[KEYWORDS[i]] = true;
  }

  // ========== 不应覆盖的 Pygments 高亮类名 ==========
  var SKIP_CLASSES = {
    'k': 1, 'kc': 1, 'kd': 1, 'kn': 1, 'kp': 1, 'kr': 1, 'kt': 1,
    's': 1, 's1': 1, 's2': 1, 'sa': 1, 'sb': 1, 'sc': 1, 'sd': 1,
    'se': 1, 'sh': 1, 'si': 1, 'sr': 1, 'ss': 1, 'sx': 1,
    'c': 1, 'cm': 1, 'c1': 1, 'cs': 1,
    'm': 1, 'mf': 1, 'mh': 1, 'mi': 1, 'mo': 1, 'il': 1,
    'nf': 1, 'fm': 1, 'nv': 1, 'vc': 1, 'vg': 1, 'vi': 1,
    'o': 1, 'ow': 1, 'cp': 1
  };

  /**
   * 判断一个文本节点是否应该被处理
   * - 直接子节点：处理（Pygments 未标记的文本）
   * - 父元素是 .n / .no 等：处理（通用 Name token，正是 hook 要拦截的）
   * - 父元素是 .k / .s / .c 等：跳过（Pygments 已高亮）
   */
  function shouldProcess(textNode) {
    var parent = textNode.parentNode;
    if (parent.tagName !== 'SPAN') return true; // 直接文本节点
    var clsList = parent.classList;
    for (var key in SKIP_CLASSES) {
      if (clsList.contains(key)) return false;
    }
    return true; // .n, .no, .na, .nb, .nc, .nl, .nn, .nx, .w 等均可处理
  }

  /**
   * 对单个 <code> 元素执行关键词高亮
   * 采用与 Python hook 完全一致的算法：
   *   按 \S+ 拆分文本为 token，逐个查 Set，命中则包裹 <span class="k|nb|nf|nv">
   * 这能正确处理 g++、apt-get 等含特殊字符的关键词。
   */
  function highlightCode(codeEl) {
    // 收集所有文本节点
    var walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (!shouldProcess(node)) continue;

      var text = node.textContent;
      if (text.length < 2) continue; // 单字符忽略

      // 匹配所有非空白 token（与 Python re.finditer(r'(\S+)', value) 一致）
      var tokens = [];
      var re = /\S+/g;
      var m;
      while ((m = re.exec(text)) !== null) {
        tokens.push({ index: m.index, word: m[0] });
      }

      // 检查是否有需要高亮的 token
      var hasMatch = false;
      for (var t = 0; t < tokens.length; t++) {
        if (KEYWORD_SET[tokens[t].word]) { hasMatch = true; break; }
      }
      if (!hasMatch) continue; // 无匹配关键词，跳过

      // 构建 fragment 替换
      var fragment = document.createDocumentFragment();
      var lastIdx = 0;

      for (var k = 0; k < tokens.length; k++) {
        var tok = tokens[k];
        // 前导空白保持原样
        if (tok.index > lastIdx) {
          fragment.appendChild(document.createTextNode(text.slice(lastIdx, tok.index)));
        }
        if (KEYWORD_SET[tok.word]) {
          var cls = KEYWORD_MAP[tok.word];
          var span = document.createElement('span');
          span.className = cls;
          span.textContent = tok.word;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(tok.word));
        }
        lastIdx = tok.index + tok.word.length;
      }
      // 尾部空白
      if (lastIdx < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      node.parentNode.replaceChild(fragment, node);
    }
  }

  /**
   * 高亮容器内所有代码块
   */
  function highlightAll(root) {
    root = root || document;
    var codeBlocks = root.querySelectorAll('.md-typeset pre code, .md-content pre code');
    for (var i = 0; i < codeBlocks.length; i++) {
      highlightCode(codeBlocks[i]);
    }
  }

  // ========== 初始化 ==========

  // DOM 就绪后首次执行
  function boot() {
    highlightAll(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Material for MkDocs 的 SPA 页面切换 hook
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () {
      highlightAll(document);
    });
  }
})();
