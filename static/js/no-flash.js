/* ========================================================================
 * no-flash.js — 配合 Material instant 导航，提前渲染 WaveDrom 波形图
 *
 * 工作原理：
 *   Material 的 instant 导航（已启用）暴露全局 RxJS Subject：
 *     - document$ : 新文档交换完成后触发（新 <article> 已注入）
 *
 *   本脚本订阅 document$，在 DOM 交换完成后立即触发 WaveDrom 渲染。
 *   原 wavedrom-init.js 用 setTimeout(200/300ms) 触发，会造成波形页面
 *   200~300ms 空白；这里在 document$ 当帧渲染，消除该空白。
 *
 * 渲染实现：
 *   不自己实现渲染，而是调用 window.__renderWaveDrom（由 wavedrom-init.js
 *   暴露）。该函数手动复现 ProcessAll 流程但避开 `head.innerHTML +=` 的
 *   head 全量重写副作用（会触发样式重排、页面跳动）。加载顺序无关：
 *   若本脚本先触发但 __renderWaveDrom 尚未定义，wavedrom-init 的
 *   setTimeout/MutationObserver 会兜底。
 *
 * 历史说明：
 *   本脚本原先还负责 instant 导航的"淡出→淡入"opacity 过渡。现装饰图
 *   已移除（见 extra.css），且 opacity 过渡在 instant 降级为整页加载时
 *   会导致内容卡在半透明/白屏，故删除。导航时直接由 Material 完成内容
 *   替换，无额外视觉包装。
 *
 * 用 window.__noFlashInit 防止重复初始化。
 * ======================================================================== */

(function () {
  'use strict';
  if (window.__noFlashInit) return;
  window.__noFlashInit = true;

  /* ---- 触发渲染：优先用 wavedrom-init 暴露的安全版本 ---- */
  function tryRender() {
    if (typeof window.__renderWaveDrom === 'function') {
      try { window.__renderWaveDrom(); } catch (e) { /* 忽略，wavedrom-init 会兜底 */ }
    }
    // 若 __renderWaveDrom 还没定义（wavedrom-init 未加载完），不做任何事——
    // wavedrom-init 自己的 setTimeout(300) / MutationObserver 会渲染。
  }

  /* ---- document$ —— DOM 交换完成后，立即渲染 WaveDrom ---- */
  if (typeof document$ !== 'undefined' && document$ && typeof document$.subscribe === 'function') {
    try {
      document$.subscribe(function () {
        requestAnimationFrame(tryRender);
      });
    } catch (e) { /* 忽略 */ }
  }

  /* ---- 首次加载：页面就绪后立即尝试渲染一次 ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRender);
  } else {
    tryRender();
  }
})();
