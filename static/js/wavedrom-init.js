// WaveDrom 初始化：渲染页面中所有 <script type="wavedrom"> 元素（大小写不敏感）。
//
// 为什么不直接用 WaveDrom.ProcessAll()：
//   ProcessAll 末尾会执行 `document.head.innerHTML += '<style>菜单</style>'`，
//   这是「全量重写 head」——浏览器要序列化整个 head（约 18 个 link/preload/
//   prefetch/stylesheet）再重新解析，触发已加载样式重新请求和应用，造成
//   「页面加载一会后突然跳动、像再次刷新」。无痕模式（无缓存）下尤其明显。
//
//   因此这里手动复现 ProcessAll 的渲染流程（eva 解析 + renderWaveForm 渲染），
//   但用安全的 DOM API 注入菜单样式（appendChild + id 防重），完全避开
//   head.innerHTML 的重写副作用。
//
// renderWaveForm 签名关键点：
//   renderWaveForm(index, source, output, notFirstSignal) 内部会查找
//   document.getElementById(output + index) 作为渲染目标元素。因此 display
//   容器 id 必须是 output + index 的拼接结果，且 index 参数 = 该后缀数字。
//   ProcessAll 用从 0 开始的整数下标同时作 index 和 id 后缀，这里照做。
//
// 幂等性：
//   每个 script 处理完打上 data-wavedrom-rendered="1"，下次跳过，
//   避免重复插入显示 div（ProcessAll 用「父节点 svg 已存在」判断不够可靠）。
(function () {
  var RENDERED_MARK = 'data-wavedrom-rendered';
  var MENU_STYLE_ID = '__wavedrom-menu-style';
  var PREFIX = 'WaveDrom_Display_'; // 与 ProcessAll 一致的前缀
  // 与 ProcessAll 内部完全一致的菜单样式（保留右键菜单功能）
  var MENU_STYLE_CSS =
    'div.wavedromMenu{position:fixed;border:solid 1pt#CCCCCC;background-color:white;' +
    'box-shadow:0px 10px 20px #808080;cursor:default;margin:0px;padding:0px;}' +
    'div.wavedromMenu>ul{margin:0px;padding:0px;}' +
    'div.wavedromMenu>ul>li{padding:2px 10px;list-style:none;}' +
    'div.wavedromMenu>ul>li:hover{background-color:#b5d5ff;}';

  /* 安全注入菜单样式（一次性，用 appendChild 而非 innerHTML +=）*/
  function injectMenuStyle() {
    if (document.getElementById(MENU_STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = MENU_STYLE_ID;
    style.setAttribute('type', 'text/css');
    style.textContent = MENU_STYLE_CSS;
    document.head.appendChild(style);
  }

  /* 查找所有未渲染的 wavedrom script（大小写不敏感）*/
  function getUnrenderedScripts() {
    var out = [];
    var all = document.querySelectorAll('script[type]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getAttribute('type').toLowerCase() !== 'wavedrom') continue;
      if (el.getAttribute(RENDERED_MARK) === '1') continue; // 已处理
      out.push(el);
    }
    return out;
  }

  /* 为本次批渲染分配唯一的 id 后缀，避免与历史渲染（含可能的 ProcessAll 残留）冲突。
   * 用一个全局递增计数器 + 时间戳前缀，保证 output+index 拼接出的 id 在文档内唯一。 */
  var idBase = Date.now() + '_';
  var idCounter = 0;

  function renderWaveDrom() {
    if (typeof WaveDrom === 'undefined') return;
    if (typeof WaveDrom.eva !== 'function' || typeof WaveDrom.RenderWaveForm !== 'function') return;
    var scripts = getUnrenderedScripts();
    if (scripts.length === 0) return;

    injectMenuStyle(); // 一次性、安全的样式注入

    var notFirstSignal = false;
    for (var i = 0; i < scripts.length; i++) {
      var el = scripts[i];
      // 分配唯一后缀。renderWaveForm(0, obj, outPrefix, ...) 会找 outPrefix + 0，
      // 所以 display 容器 id = outPrefix + '0'，script 的 inputId 任意唯一即可。
      var seq = idBase + (idCounter++);
      var outPrefix = PREFIX + seq + '_'; // display id = outPrefix + '0'
      var displayId = outPrefix + '0';
      var inputId = 'InputJSON_' + seq;

      el.setAttribute('id', inputId);
      var display = document.createElement('div');
      display.id = displayId;
      el.parentNode.insertBefore(display, el);

      try {
        var obj = WaveDrom.eva(inputId);
        // index 参数必须与 displayId 末尾数字一致（这里是 '0'）
        WaveDrom.RenderWaveForm(0, obj, outPrefix, notFirstSignal);
        if (obj && obj.signal && !notFirstSignal) notFirstSignal = true;
      } catch (e) {
        console.warn('WaveDrom render error:', e);
      }

      el.setAttribute(RENDERED_MARK, '1'); // 标记已处理，防止重复
    }
  }

  // 暴露为全局函数，供 no-flash.js 在 instant 导航 document$ 时提前调用，
  // 避免两份脚本重复实现渲染逻辑。加载顺序无关：若 no-flash 先触发但本函数
  // 尚未定义，下面的 setTimeout/MutationObserver 会兜底。
  window.__renderWaveDrom = renderWaveDrom;

  // 首次加载
  setTimeout(renderWaveDrom, 100);

  // SPA 导航：监听内容区 DOM 变化
  var contentEl = document.querySelector('.md-content__inner') || document.querySelector('article');
  if (contentEl) {
    new MutationObserver(function () {
      setTimeout(renderWaveDrom, 200);
    }).observe(contentEl, { childList: true, subtree: true });
  }
})();
