function hideScrollbars() {
  var styleId = '__hide-scrollbars-style';
  if (document.getElementById(styleId)) return; // 已存在，避免重复注入

  var style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .md-sidebar--primary ::-webkit-scrollbar,
    .md-sidebar--secondary ::-webkit-scrollbar,
    .md-nav ::-webkit-scrollbar,
    .md-sidebar__scrollwrap::-webkit-scrollbar,
    .md-nav__scrollwrap::-webkit-scrollbar {
      display: none !important;
    }
    .md-sidebar--primary,
    .md-sidebar--secondary,
    .md-nav,
    .md-sidebar__scrollwrap,
    .md-nav__scrollwrap {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  `;
  document.head.appendChild(style);
}

// 给外链加 rel="noopener noreferrer" 安全属性（防止 target=_blank 的外链通过
// window.opener 操控本页面）。md-external/md-internal class删除以提升性能
// 分批处理避免大量链接阻塞主线程。
var LINK_CHUNK = 100;
function markExternalLinks() {
  var links = document.querySelectorAll('.md-content a[href^="http"]:not([data-external-marked])');
  if (!links.length) return;

  function markOne(link) {
    link.setAttribute('data-external-marked', '1');
    link.setAttribute('rel', 'noopener noreferrer');
  }

  // 单条处理极轻（只 setAttribute），但链接多时分批保险
  var i = 0;
  function processChunk() {
    var end = Math.min(i + LINK_CHUNK, links.length);
    for (; i < end; i++) {
      markOne(links[i]);
    }
    if (i < links.length) {
      requestAnimationFrame(processChunk);
    }
  }
  requestAnimationFrame(processChunk);
}

function syncSearchHint() {
  var params = new URLSearchParams(window.location.search);
  var h = params.get('h') || '';
  var input = document.querySelector('.md-search__input');
  if (input) input.value = h;
  var span = document.querySelector('.sidebar-search__button span');
  if (span) {
    if (!span.getAttribute('data-original')) {
      span.setAttribute('data-original', span.textContent);
    }
    span.textContent = h || span.getAttribute('data-original');
    if (h) { span.classList.add('search-active'); }
    else { span.classList.remove('search-active'); }
  }
}

function reinitSelectors() {
  if (window._initSelectors) window._initSelectors();
}

/**
 * 直接设置 .md-grid 的 max-width inline style
 * 先关 transition → 设值 → 强制重排 → 再开 transition，避免导航重排期间从 100% 过渡到 76%
 */
function applyGridWidth(isWide) {
  var grid = document.querySelector('.md-grid');
  if (!grid) return;
  var desired = isWide ? '100%' : '76%';
  if (grid.style.maxWidth === desired) return;
  grid.style.transition = 'none';
  grid.style.maxWidth = desired;
  grid.offsetHeight;
  grid.style.transition = 'max-width 0.25s ease';
}

function reapplyWideScreenState() {
  var stored = localStorage.getItem('wideScreen');
  var isWideScreen = stored === null ? true : stored === 'true';
  var changed =
    document.body.classList.contains('wide-screen') !== isWideScreen;
  if (changed) {
    if (isWideScreen) {
      document.body.classList.add('wide-screen');
      document.body.classList.remove('narrow-screen');
    } else {
      document.body.classList.remove('wide-screen');
      document.body.classList.add('narrow-screen');
    }
  }
  applyGridWidth(isWideScreen);
  var toggleBtn = document.getElementById('wide-screen-toggle');
  if (toggleBtn) {
    var needActive = !!isWideScreen;
    if (toggleBtn.classList.contains('wide-screen-active') !== needActive) {
      toggleBtn.classList.toggle('wide-screen-active', needActive);
    }
  }
}

var __lastPageChangeKey = '';
function onPageChange() {
    var curKey = location.pathname + location.search;
  if (curKey === __lastPageChangeKey) return;
  __lastPageChangeKey = curKey;

  hideScrollbars();
  markExternalLinks();
  // syncSearchHint(); 不回填搜索条件
  reapplyWideScreenState();
  if (typeof window.refreshBackToTop === 'function') {
    window.refreshBackToTop();
    requestAnimationFrame(window.refreshBackToTop);
  }
  if (document.querySelectorAll('#repo-options .option').length === 0) {
    requestAnimationFrame(function () {
      if (document.querySelectorAll('#repo-options .option').length === 0) {
        reinitSelectors();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  onPageChange();

  var lastPageKey = location.pathname + location.search;
  document.addEventListener('hashchange', function () {
    var curKey = location.pathname + location.search;
    if (curKey !== lastPageKey) {
      lastPageKey = curKey;
      __lastPageChangeKey = '';
      setTimeout(onPageChange, 300);
    }
  });
});

// 导航开始：仅重置去重 key，让后续 document$ 的 onPageChange 重新执行。
// 不再在此调用 applyGridWidth —— .md-main__inner.md-grid 是 SPA 常驻容器，
// inline max-width 跨导航不会丢失，且 DOM 交换同帧调用会触发 querySelector
// + localStorage 读取，与 Material 的 scrollIntoView 叠加导致内容区上下弹跳。
// grid 宽度的真正兜底在 onPageChange → reapplyWideScreenState 中（交换后执行）。
if (typeof location$ !== 'undefined') {
  location$.subscribe(function () {
    __lastPageChangeKey = '';
  });
}

document$.subscribe(function() {
  __lastPageChangeKey = '';
  onPageChange();
});

function setupSidebarToggle() {
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'sidebar-toggle';
  toggleBtn.innerHTML = '<span class="sidebar-toggle__icon"></span>';
  document.body.appendChild(toggleBtn);
}

setupSidebarToggle();

function setupWideScreenToggle() {
  var toggleBtn = document.getElementById('wide-screen-toggle');
  if (!toggleBtn) return;

  // 读取用户偏好，默认宽屏
  var stored = localStorage.getItem('wideScreen');
  var isWideScreen = stored === null ? true : stored === 'true';

  function updateWideScreenState() {
    // 清理 <html> 上的 prefer-narrow 类（仅首帧防闪用，JS 接管后不需要）
    document.documentElement.classList.remove('prefer-narrow');
    if (isWideScreen) {
      document.body.classList.add('wide-screen');
      document.body.classList.remove('narrow-screen');
      toggleBtn.classList.add('wide-screen-active');
    } else {
      document.body.classList.remove('wide-screen');
      document.body.classList.add('narrow-screen');
      toggleBtn.classList.remove('wide-screen-active');
    }
    localStorage.setItem('wideScreen', isWideScreen);
    applyGridWidth(isWideScreen);
  }

  updateWideScreenState();

  toggleBtn.addEventListener('click', function () {
    isWideScreen = !isWideScreen;
    updateWideScreenState();
  });
}

setupWideScreenToggle();

function setupBackToTopButton() {
  // 把检查函数挂到全局，onPageChange 中可主动调用（SPA 导航后必须刷新）
  window.refreshBackToTop = function () {
    var backToTop = document.querySelector('.md-top');
    if (!backToTop) return;
    if (window.scrollY > 0) {
      backToTop.style.opacity = '1';
      backToTop.style.pointerEvents = 'auto';
    } else {
      backToTop.style.opacity = '0';
      backToTop.style.pointerEvents = 'none';
    }
  };

  // 首次初始化立即执行
  window.refreshBackToTop();

  // 使用 rAF 节流代替 setTimeout(50)，即时响应滚动，避免 debounce 错过时机
  var rAFId = null;
  window.addEventListener('scroll', function () {
    if (rAFId !== null) return;
    rAFId = requestAnimationFrame(function () {
      rAFId = null;
      window.refreshBackToTop();
    });
  }, { passive: true });

  var backToTop = document.querySelector('.md-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      // 清 hash 只在按钮 click
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      document.querySelectorAll('.md-sidebar--secondary .md-nav__link').forEach(function(link) {
        link.classList.remove('md-nav__link--active');
      });

      var checks = 0;
      function tick() {
        window.refreshBackToTop();
        checks++;
        if (checks < 8) setTimeout(tick, checks < 3 ? 50 : 120);
      }
      tick();
    });
  }
}

setupBackToTopButton();

// 从 mkdocs.yml extra.feedback_url 动态读取（通过 base.html 注入的 meta 标签），
// 若不存在则回退到默认 GitCode Issues 链接
var FEEDBACK_URL = (function () {
  var meta = document.querySelector('meta[name="gitcode-issues-url"]');
  return meta ? meta.getAttribute('content') : 'https://gitcode.com/HiSpark/fbb_ws63/issues';
})();

var fab = document.createElement('a');
fab.className = 'feedback-fab';
fab.href = FEEDBACK_URL;
fab.target = '_blank';
fab.rel = 'noopener noreferrer';
fab.setAttribute('role', 'button');
fab.innerHTML = '<span class="fab-icon">&#9993;</span><span class="fab-label">意见反馈</span>';
document.body.appendChild(fab);

// ============================================================
// 以下弹框交互代码已注释（改为直跳 GitCode Issues）
// 如需恢复弹框，取消下方注释即可
// ============================================================

/*
var overlay = document.createElement('div');
overlay.className = 'feedback-overlay';
overlay.innerHTML = `
  <div class="feedback-modal">
    <div class="feedback-modal-header">
      <h3><span>&#9993;</span> 意见反馈</h3>
      <button class="feedback-modal-close">&times;</button>
    </div>
    <div class="feedback-modal-body">
      <div id="feedback-form-area">
        <div class="feedback-field">
          <label for="fb-page">当前页面</label>
          <input type="text" id="fb-page" readonly>
        </div>
        <div class="feedback-field">
          <label for="fb-type">反馈类型 <span class="required">*</span></label>
          <select id="fb-type">
            <option value="">请选择</option>
            <option value="文档错误">文档错误（描述不清、错别字、格式问题）</option>
            <option value="内容缺失">内容缺失（缺少必要说明、接口、示例）</option>
            <option value="示例问题">示例代码问题（编译失败、运行异常）</option>
            <option value="改进建议">改进建议（排版优化、内容补充建议）</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="feedback-field">
          <label for="fb-desc">问题描述 <span class="required">*</span></label>
          <textarea id="fb-desc" placeholder="请详细描述您遇到的问题或改进建议..."></textarea>
        </div>
        <div class="feedback-field">
          <label for="fb-name">您的称呼</label>
          <input type="text" id="fb-name" placeholder="可选">
        </div>
        <div class="feedback-field">
          <label for="fb-contact">联系方式（邮箱 / 微信 / 手机）</label>
          <input type="text" id="fb-contact" placeholder="可选，方便我们与您联系">
        </div>
        <button class="feedback-submit" id="fb-submit">
          <span>&#10148;</span> 提交反馈（将跳转到 GitHub Issue）
        </button>
        <div class="feedback-field" style="margin-bottom:0">
          <div class="field-hint">提交后将跳转到 GitHub Issues 页面，点击 "Submit new issue" 即可完成提交。需要 GitHub 账号。</div>
        </div>
      </div>
      <div class="feedback-success" id="feedback-success-area">
        <div class="success-icon">&#10004;</div>
        <h4>感谢您的反馈！</h4>
        <p>您的意见已提交到 GitHub Issues。</p>
        <p>请在新页面确认并点击 "Submit new issue" 完成提交。</p>
        <div class="success-note">我们会在收到后尽快处理。</div>
      </div>
    </div>
  </div>
`;
document.body.appendChild(overlay);

var modal = overlay.querySelector('.feedback-modal');
var closeBtn = overlay.querySelector('.feedback-modal-close');
var pageField = document.getElementById('fb-page');
var typeField = document.getElementById('fb-type');
var descField = document.getElementById('fb-desc');
var nameField = document.getElementById('fb-name');
var contactField = document.getElementById('fb-contact');
var submitBtn = document.getElementById('fb-submit');
var formArea = document.getElementById('feedback-form-area');
var successArea = document.getElementById('feedback-success-area');

pageField.value = window.location.href;

fab.addEventListener('click', function (e) {
  e.preventDefault();
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  formArea.style.display = 'block';
  successArea.classList.remove('active');
  descField.value = '';
  typeField.value = '';
  nameField.value = '';
  contactField.value = '';
  pageField.value = window.location.href;
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<span>&#10148;</span> 提交反馈（将跳转到 GitHub Issue）';
});

function closeFeedback() {
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeFeedback);
overlay.addEventListener('click', function (e) {
  if (e.target === overlay) closeFeedback();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && overlay.classList.contains('active')) {
    closeFeedback();
  }
});

submitBtn.addEventListener('click', function () {
  var type = typeField.value.trim();
  var desc = descField.value.trim();

  if (!type) {
    typeField.focus();
    typeField.style.borderColor = 'var(--hi-red)';
    setTimeout(function () { typeField.style.borderColor = ''; }, 2000);
    return;
  }
  if (!desc) {
    descField.focus();
    descField.style.borderColor = 'var(--hi-red)';
    setTimeout(function () { descField.style.borderColor = ''; }, 2000);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '正在跳转...';

  var pageUrl = window.location.href;
  var name = nameField.value.trim() || '(未填写)';
  var contact = contactField.value.trim() || '(未填写)';

  var title = '[反馈] ' + type + ' - ' + document.title;

  var body = '## 反馈信息\n\n'
    + '**页面**: ' + pageUrl + '\n\n'
    + '**反馈类型**: ' + type + '\n\n'
    + '**问题描述**:\n' + desc + '\n\n'
    + '---\n'
    + '**提交者**: ' + name + '\n'
    + '**联系方式**: ' + contact + '\n'
    + '**浏览器**: ' + navigator.userAgent + '\n'
    + '**提交时间**: ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  var issueUrl = 'https://github.com/HivsDev/pegasus_doc/issues/new?title='
    + encodeURIComponent(title)
    + '&body='
    + encodeURIComponent(body);

  window.open(issueUrl, '_blank');

  formArea.style.display = 'none';
  successArea.classList.add('active');

  setTimeout(function () {
    closeFeedback();
  }, 5000);
});
*/

document.addEventListener('click', function (e) {
  if (e.target.closest('.sidebar-search__button')) {
    const searchDialog = document.querySelector('.md-search');
    if (searchDialog) {
      searchDialog.style.display = 'block';
      const searchInput = searchDialog.querySelector('.md-search__input');
      const searchInner = searchDialog.querySelector('.md-search__inner');
      searchInner.classList.add('active');
      if (searchInput) {
        // 从 URL ?h= 回填搜索词（回车搜索时存入的，保留上次搜索状态）
        var params = new URLSearchParams(window.location.search);
        var h = params.get('h');
        if (h) {
          searchInput.value = h;
        }
        searchInput.focus();
      }
    }
  }
  if (e.target.closest('.md-search__overlay')) {
    closeSearch();
  }
  // 点击搜索结果列表里的链接：关闭搜索框
  // Material 原生用 at("search", false) 关闭，但本项目搜索框用 active class 控制，
  // 不依赖 checkbox，所以 Material 的关闭对本项目无效。这里主动 closeSearch。
  // 解决"点击同一个搜索结果，第二次搜索框没关闭"（URL 未变时 Material 不触发导航，
  // 也就不会间接关闭搜索框）。
  if (e.target.closest('.md-search-result a')) {
    closeSearch();
  }
  // 点 reset（clear ✕）按钮：清 input + 清 URL ?h= + 清文章高亮，彻底清除搜索条件
  // 否则 URL 还带着 ?h=，下次打开搜索框又会被回填回来；文章里的 <mark> 高亮也会残留
  if (e.target.closest('.md-search__options > button[type="reset"]')) {
    var searchInput = document.querySelector('.md-search__input');
    if (searchInput) searchInput.value = '';
    // 清除 URL 的 ?h= 参数（不触发页面跳转）
    var url = new URL(window.location.href);
    if (url.searchParams.has('h')) {
      url.searchParams.delete('h');
      window.history.replaceState(null, '', url.toString());
    }
    // 清除文章中的搜索高亮：Material 给匹配词包了 <mark data-md-highlight>
    // 用 unwrap 方式移除 mark 标签，保留里面的文字
    var highlights = document.querySelectorAll('mark[data-md-highlight]');
    highlights.forEach(function (mark) {
      var parent = mark.parentNode;
      // 将 mark 替换为它的文本内容（保留文字，去掉高亮标签）
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });
    // 合并被拆分的相邻文本节点（避免后续渲染异常）
    var content = document.querySelector('.md-content');
    if (content) content.normalize();
  }
});

function closeSearch() {
  const searchDialog = document.querySelector('.md-search');
  const searchInner = searchDialog.querySelector('.md-search__inner');
  if (searchDialog) {
    searchDialog.style.display = 'none';
    searchInner.classList.remove('active');
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeSearch();
  }
});

// 回车搜索：把搜索词存入 URL ?h=，然后关闭搜索框
// 存入 URL 是为了下次打开搜索框时能回填（保留搜索状态）；
// 关闭搜索框是回车后的期望行为。reset 按钮会同时清 input 和 URL ?h=。
document.addEventListener('submit', function (e) {
  var form = e.target.closest && e.target.closest('form.md-search__form');
  if (!form) return;
  var input = form.querySelector('.md-search__input');
  if (!input) return;
  var value = input.value.trim();
  var url = new URL(window.location.href);
  if (value) {
    url.searchParams.set('h', value);
  } else {
    url.searchParams.delete('h');
  }
  window.history.replaceState(null, '', url.toString());
  // 延迟关闭，让 Material 的搜索 worker 先处理完本次查询
  setTimeout(closeSearch, 100);
}, true);

function setupImageZoom() {
  var lightbox = document.querySelector('.image-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <button class="image-lightbox-close">&times;</button>
      <img src="" alt="" draggable="false">
    `;
    document.body.appendChild(lightbox);
  }

  var lightboxImg = lightbox.querySelector('img');
  var closeBtn = lightbox.querySelector('.image-lightbox-close');

  // --- 拖拽 / 缩放状态 ---
  var scale = 1;
  var translateX = 0;
  var translateY = 0;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var startTranslateX = 0;
  var startTranslateY = 0;

  function applyTransform() {
    lightboxImg.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
  }

  function resetTransform() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    lightboxImg.style.transform = '';
    lightboxImg.style.cursor = 'zoom-out';
  }

  function openLightbox(img) {
    resetTransform();
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    resetTransform();
  }

  // --- 鼠标拖拽平移 ---
  // 按需注册 mousemove/mouseup：mousedown 时注册，mouseup 后移除。
  // 避免每次鼠标移动都进回调（即使不拖拽），减少空闲时的无效事件触发。
  var onMove = function(e) {
    translateX = startTranslateX + (e.clientX - dragStartX);
    translateY = startTranslateY + (e.clientY - dragStartY);
    applyTransform();
  };
  var onUp = function() {
    isDragging = false;
    lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-out';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  lightboxImg.addEventListener('mousedown', function(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startTranslateX = translateX;
    startTranslateY = translateY;
    lightboxImg.style.cursor = 'grabbing';
    e.preventDefault();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // --- 滚轮缩放（居中缩放，不改变位置） ---
  lightbox.addEventListener('wheel', function(e) {
    if (!lightbox.classList.contains('active')) return;
    e.preventDefault();

    var delta = e.deltaY < 0 ? 0.15 : -0.15;
    scale = Math.max(0.3, Math.min(8, scale + delta));

    applyTransform();
    lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-out';
  }, { passive: false });

  // --- 双击 lightbox 背景还原缩放 ---
  lightbox.addEventListener('dblclick', function(e) {
    if (!lightbox.classList.contains('active')) return;
    if (e.target !== lightbox && e.target !== lightboxImg) return;
    resetTransform();
    applyTransform();
  });

  // --- 关闭按钮 ---
  closeBtn.addEventListener('click', closeLightbox);

  // --- 点击背景关闭 ---
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // --- Escape 关闭 ---
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // --- 双击图片缩略图打开 lightbox ---
  document.addEventListener('dblclick', function(e) {
    var img = e.target.closest('.md-typeset img');
    if (!img) return;
    e.preventDefault();
    openLightbox(img);
  });
}

setupImageZoom();

/* ============================================================
 * 图片灰色容器：按原始宽度决定是否包裹 .img-wrapper
 *
 * 规则：
 *   - naturalWidth > 1200px：CSS 的 max-width:1200px 自动等比压缩，不包容器
 *   - 100px ≤ naturalWidth ≤ 1200px：包裹 .img-wrapper（灰色背景 + 上下 16px）
 *   - naturalWidth < 100px：不加任何样式（保持原样）
 *
 * 纯 CSS 无法根据图片自身宽度分支（没有 "width > N" 选择器），用 JS 判断
 * naturalWidth 实现。处理时机：首次加载 + SPA document$ 导航后。
 * ============================================================ */
(function () {
  var MIN_WRAP = 100;    // 小于此宽度不包容器
  var MAX_WRAP = 1200;   // 大于此宽度也不包（靠 CSS max-width 压缩）
  var CHUNK_SIZE = 200;  // 每帧处理图片数量。有 width 属性的处理极轻（只 setAttribute+DOM插入），
                         // 200/帧能在 ~5 帧（80ms）内处理完 871 图页面，避免滚动时图片先出底色后出

  function processImage(img) {
    if (!img || img.dataset.imgProcessed) return;
    // 跳过已包裹的
    if (img.parentElement && img.parentElement.classList.contains('img-wrapper')) return;
    // 跳过非内容图片：图标/logo/按钮（按 class 过滤，比 closest 快）
    if (img.closest('.grid.cards, .image-lightbox')) return;
    // UI 图标（logo、宽窄屏按钮等）不在内容区，但选择器可能误选，这里按 class 排除
    if (img.classList.contains('md-logo__img') ||
        img.classList.contains('wide-screen-icon')) return;

    var apply = function () {
      if (img.dataset.imgProcessed) return;
      img.dataset.imgProcessed = '1';
      // 有效宽度：HTML width 属性优先，否则用 naturalWidth
      var htmlWidth = img.getAttribute('width');
      var w = htmlWidth ? parseInt(htmlWidth, 10) : img.naturalWidth;
      if (!w) return; // 还没加载完或 width 属性无效
      // 只包裹 100~1200px 的图片
      if (w >= MIN_WRAP && w <= MAX_WRAP) {
        var wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      }
    };

    // 有 HTML width 属性的图片：width 是 HTML 写死的，立即可读，不用等加载
    var htmlWidth = img.getAttribute('width');
    if (htmlWidth) {
      apply();
      return;
    }
    // 无 width 属性的图片：需要等加载完才能读 naturalWidth
    if (img.complete && img.naturalWidth) {
      apply();
    } else {
      img.addEventListener('load', apply, { once: true });
    }
  }

  // 方案 B：首屏同步处理（立即出底色），视口外分批处理（不卡顿）。
  // 871 图页面：首屏 ~10 张同步处理 < 1ms，剩余 800+ 张分批，不阻塞主线程。
  function processAllImages() {
    var content = document.querySelector('.md-content__inner') || document.querySelector('.md-typeset');
    if (!content) return;
    var imgs = content.querySelectorAll('img');
    if (!imgs.length) return;

    var viewH = window.innerHeight || document.documentElement.clientHeight;
    var deferred = []; // 视口外的图片，稍后分批处理

    // 第 1 步：同步处理首屏可见的图片（立即出底色，无延迟）
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      // 用 getBoundingClientRect 判断是否在视口内（含一点预判，滚动更平滑）
      var rect = img.getBoundingClientRect();
      // 在视口上方一点点到下方一点点之间，视为首屏
      if (rect.top < viewH + 100 && rect.bottom > -100) {
        processImage(img);
      } else {
        deferred.push(img);
      }
    }

    // 第 2 步：视口外的图片分批处理
    if (!deferred.length) return;
    var idx = 0;
    function processChunk() {
      var end = Math.min(idx + CHUNK_SIZE, deferred.length);
      for (; idx < end; idx++) {
        processImage(deferred[idx]);
      }
      if (idx < deferred.length) {
        requestAnimationFrame(processChunk);
      }
    }
    requestAnimationFrame(processChunk);
  }

  // 首次加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllImages);
  } else {
    processAllImages();
  }
  // SPA 导航后重新处理
  if (typeof document$ !== 'undefined' && document$ && document$.subscribe) {
    document$.subscribe(processAllImages);
  }
})();

// ========== SPA 模式锚点跳转修复 ==========
// (function() {
//   function scrollToAnchor(hash) {
//     hash = hash || decodeURIComponent(window.location.hash);
//     if (!hash) return;
//     var el = document.getElementById(hash.replace('#', ''));
//     if (!el) el = document.querySelector('[id=\"' + CSS.escape(hash.replace('#', '')) + '\"]');
//     if (!el) return;
//     var top = el.getBoundingClientRect().top + window.pageYOffset - 80;
//     window.scrollTo({ top: top, behavior: 'smooth' });
//   }
//   var contentEl = document.querySelector('.md-content__inner') || document.querySelector('article');
//   if (contentEl) {
//     var observer = new MutationObserver(function() {
//       if (window.location.hash) {
//         var attempts = 0;
//         function tryScroll() {
//           var el = document.getElementById(window.location.hash.replace('#', ''));
//           if (el) {
//             var top = el.getBoundingClientRect().top + window.pageYOffset - 80;
//             window.scrollTo({ top: top, behavior: 'smooth' });
//           } else if (attempts < 20) {
//             attempts++;
//             requestAnimationFrame(tryScroll);
//           }
//         }
//         tryScroll();
//       }
//     });
//     observer.observe(contentEl, { childList: true, subtree: true });
//   }
//   window.addEventListener('hashchange', function() {
//     setTimeout(function() { scrollToAnchor(window.location.hash); }, 300);
//   });
//   if (window.location.hash) {
//     setTimeout(function() { scrollToAnchor(window.location.hash); }, 500);
//   }
// })();

// ========== 二级节点二次点击：切换三级展开/收缩 ==========
// 点击左侧树中已激活（当前页面）的二级有链接节点 → 切换三级子目录的展开/收缩
document.addEventListener('click', function(e) {
  // 只处理左侧导航区域内的 a 标签点击
  if (!e.target.closest('.md-sidebar--primary')) return;

  var link = e.target.closest('a.md-nav__link');
  if (!link) return;

  // 必须是已激活的当前页面链接
  if (!link.classList.contains('md-nav__link--active')) return;

  var item = link.closest('.md-nav__item');
  if (!item) return;

  // 如果被点击的item本身是叶子节点（没有 .md-nav__item--nested 子元素），不触发任何行为
  var isLeafNode = !item.classList.contains('md-nav__item--nested');
  if (isLeafNode) return;

  // 一级节点（无 a 标签，仅 label + icon）保持原有行为，不参与 toggle
  // 排除一级节点：一级节点的一级子 nav 的 data-md-level 为 "0" 且父级是 .md-nav--primary
  var parentNav = item.closest('.md-nav');
  if (parentNav && parentNav.closest('.md-nav--primary') && parentNav.getAttribute('data-md-level') === '0') return;

  // 找到对应的 toggle checkbox
  var toggle = item.querySelector(':scope > .md-nav__toggle');
  if (!toggle) return;

  // 切换展开/收缩
  toggle.checked = !toggle.checked;
  e.preventDefault();
});

// ========== 右侧 TOC 高亮：根据 URL hash 精确高亮对应项 ==========
// 修复原代码 3 个 bug：
//   A. indexOf 模糊匹配 → 改为精确匹配（hash 互相包含时会高亮错项）
//   B. MutationObserver 只活 10ms → 删除无效逻辑，改用 hashchange 直接处理
//   C. 与 navigation.tracking 冲突 → tracking 滚动改 hash 时也正确响应
(function() {
  var TOC_MAP_KEY = '__tocLinkMap';

  function normalizeHash(h) {
    if (!h) return null;
    var idx = h.lastIndexOf('#');
    return idx >= 0 ? h.substring(idx) : null;
  }

  // 构建 hash → TOC 链接的映射（精确匹配，不做子串）
  function buildTocMap() {
    var map = new Map();
    var tocLinks = document.querySelectorAll('.md-sidebar--secondary .md-nav__link');
    for (var i = 0; i < tocLinks.length; i++) {
      var link = tocLinks[i];
      var href = link.getAttribute('href');
      var h = normalizeHash(href);
      if (h) map.set(h, link);  // 精确 key，不用 indexOf
    }
    window[TOC_MAP_KEY] = map;
    return map;
  }

  function getTocMap() {
    return window[TOC_MAP_KEY] || buildTocMap();
  }

  // 精确高亮：只高亮 hash 完全匹配的项，清除其他项
  function setActive() {
    var hash = normalizeHash(window.location.hash);
    var tocLinks = document.querySelectorAll('.md-sidebar--secondary .md-nav__link');
    if (!hash) {
      // 无 hash 时清除所有高亮
      for (var j = 0; j < tocLinks.length; j++) {
        tocLinks[j].classList.remove('md-nav__link--active');
      }
      return;
    }

    var map = getTocMap();
    var target = map.get(hash);  // 精确匹配，O(1)
    if (!target) return;  // 找不到就不动（不再用 indexOf 模糊匹配）

    for (var k = 0; k < tocLinks.length; k++) {
      if (tocLinks[k] !== target) {
        tocLinks[k].classList.remove('md-nav__link--active');
      }
    }
    target.classList.add('md-nav__link--active');
  }

  // hashchange：URL hash 变化时重新高亮（含 navigation.tracking 滚动改 hash）
  // 用 rAF 节流，避免 tracking 快速改 hash 时频繁重算
  var rafId = null;
  window.addEventListener('hashchange', function() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function() {
      rafId = null;
      setActive();
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildTocMap);
  } else {
    buildTocMap();
  }
  // SPA 导航后重建 map（新页面 TOC 内容不同）
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function() {
      buildTocMap();
      // 导航后立即按当前 hash 高亮一次
      requestAnimationFrame(setActive);
    });
  }
})();

// ========== 左侧树拖拽宽度 + 收起/展开按钮联动 ==========
(function() {
  var COLLAPSE_THRESHOLD = 2;
  var MIN_WIDTH_PX = 112;
  var initialWidth = 0;
  var currentExpandedWidth = 0;
  var isDragging = false;
  var startX = 0;
  var startWidth = 0;
  var handle = null;
  var toggleBtn = null;
  var root = null;

  function applyWidth(w, withTransition) {
    w = Math.max(MIN_WIDTH_PX, Math.min(initialWidth || w, w));
    root.style.setProperty('--sidebar-drag-width', w + 'px');
    root.style.setProperty('--md-sidebar-width', w + 'px');
    var sidebar = document.querySelector('.md-sidebar--primary');
    if (sidebar) {
      sidebar.style.transition = withTransition ? 'width 0.3s ease' : 'none';
    }
    var toggle = document.querySelector('.sidebar-toggle');
    if (toggle) {
      toggle.style.transition = withTransition ? 'left 0.3s ease' : 'none';
    }
  }

  function setCollapsed(collapsed) {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  // 按需注册：mousedown 时才注册 mousemove/mouseup，mouseup 后移除。
  // 避免每次鼠标移动都进回调（即使不拖拽侧边栏），减少空闲时无效事件触发。
  function onMouseDown(e) {
    var sidebar = document.querySelector('.md-sidebar--primary');
    if (!sidebar) return;
    isDragging = true;
    startX = e.clientX;
    startWidth = parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-drag-width')) || initialWidth;
    if (handle) handle.classList.add('active');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    var delta = e.clientX - startX;
    var newWidth = Math.max(MIN_WIDTH_PX, Math.min(initialWidth, startWidth + delta));
    applyWidth(newWidth, false);
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (handle) handle.classList.remove('active');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    var finalWidth = parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-drag-width')) || 0;
    if (finalWidth <= COLLAPSE_THRESHOLD) {
      setCollapsed(true);
    } else {
      currentExpandedWidth = finalWidth;
      setCollapsed(false);
    }
  }

  function initDrag() {
    var sidebar = document.querySelector('.md-sidebar--primary');
    if (!sidebar) return;
    root = document.documentElement;

    var computed = getComputedStyle(sidebar);
    initialWidth = parseFloat(computed.width);
    currentExpandedWidth = initialWidth;

    root.style.setProperty('--sidebar-max-width', initialWidth + 'px');
    root.style.setProperty('--sidebar-drag-width', initialWidth + 'px');
    root.style.setProperty('--md-sidebar-width', initialWidth + 'px');

    handle = document.querySelector('.sidebar-drag-handle');
    if (!handle) {
      handle = document.createElement('div');
      handle.className = 'sidebar-drag-handle';
      document.body.appendChild(handle);
    }
    handle.addEventListener('mousedown', onMouseDown);
    // mousemove/mouseup 改为 onMouseDown 内按需注册（见上方）

    toggleBtn = document.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        var wasCollapsed = document.body.classList.contains('sidebar-collapsed');
        if (wasCollapsed) {
          setCollapsed(false);
          var restore = currentExpandedWidth > COLLAPSE_THRESHOLD ? currentExpandedWidth : initialWidth;
          applyWidth(restore, true);
          currentExpandedWidth = restore;
        } else {
          currentExpandedWidth = parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-drag-width')) || initialWidth;
          if (currentExpandedWidth <= COLLAPSE_THRESHOLD) currentExpandedWidth = initialWidth;
          setCollapsed(true);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrag);
  } else {
    initDrag();
  }
})();
