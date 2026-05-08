/**
 * VideoBackgroundManager
 * AI Native 德扑 Roguelike — 场景视频背景切换系统
 *
 * 用法：
 *   const vbm = new VideoBackgroundManager();
 *   vbm.init();
 *   vbm.transitionTo('tavern');
 *   vbm.setPokerState('allin');
 */

class VideoBackgroundManager {
  constructor(options = {}) {
    this.options = {
      fadeDuration: 500,         // 场景切换淡入淡出时长（ms）
      pokerFadeDuration: 800,    // 牌桌内状态切换时长（ms，稍慢以免突兀）
      containerId: 'vbm-container', // 挂载容器 id
      ...options,
    };

    // ── 场景定义 ──────────────────────────────────────────────
    // src 替换为你实际的视频文件路径
    this.scenes = {
      hideout: {
        id: 'hideout',
        src: 'assets/videos/hideout.mp4',
        label: '藏匿点',
        posterSrc: 'assets/images/藏匿点场景.png',
        loop: true,
        volume: 0,
      },
      tavern: {
        id: 'tavern',
        src: 'assets/videos/tavern-smoky-den.mp4',
        label: '酒馆大厅',
        posterSrc: 'assets/images/tavern-smoky-den-bg.png',
        loop: true,
        volume: 0,
      },
      // 牌桌根据游戏内状态动态选择（见 pokerStates）
      poker: {
        id: 'poker',
        src: null, // 由 pokerStates 动态决定
        label: '德扑牌桌',
        posterSrc: 'assets/images/tavern-smoky-den-bg.png',
        loop: true,
        volume: 0,
      },
      // 撤离场景由 triggerEvacuation() 决定分支
      evacuation_win: {
        id: 'evacuation_win',
        src: 'assets/videos/evacuation-win.mp4',
        label: '撤离·胜利',
        posterSrc: null,
        loop: false,
        volume: 0,
      },
      evacuation_neutral: {
        id: 'evacuation_neutral',
        src: 'assets/videos/evacuation-neutral.mp4',
        label: '撤离·平静',
        posterSrc: null,
        loop: false,
        volume: 0,
      },
      evacuation_fail: {
        id: 'evacuation_fail',
        src: 'assets/videos/evacuation-fail.mp4',
        label: '撤离·失败',
        posterSrc: null,
        loop: false,
        volume: 0,
      },
    };

    // ── 牌桌内状态（根据游戏事件切换） ──────────────────────
    // threshold: 触发该状态的最低底池值（仅 pot 类型使用）
    this.pokerStates = {
      normal: {
        src: 'assets/videos/tavern-smoky-den.mp4',
        label: '常规对局',
        posterSrc: 'assets/images/tavern-smoky-den-bg.png',
      },
      highstakes: {
        src: 'assets/videos/tavern-rooftop-club.mp4',
        label: '高额底池',
        posterSrc: 'assets/images/tavern-rooftop-club-bg.png',
        potThreshold: 500,     // 底池超过此值时触发
      },
      allin: {
        src: 'assets/videos/tavern-high-rise-suite.mp4',
        label: 'All-in',
        posterSrc: 'assets/images/tavern-high-rise-suite-bg.png',
      },
      showdown: {
        src: 'assets/videos/tavern-high-rise-suite.mp4',
        label: '摊牌',
        posterSrc: 'assets/images/tavern-high-rise-suite-bg.png',
      },
    };

    // ── 内部状态 ──────────────────────────────────────────────
    this._currentScene = null;      // 当前场景 id
    this._currentPokerState = 'normal';
    this._activeEl = null;          // 当前播放的 video 元素
    this._standbyEl = null;         // 待机（预加载）的 video 元素
    this._container = null;
    this._transitioning = false;
    this._preloadQueue = new Set();
    this._listeners = {};           // 事件监听器
  }

  // ════════════════════════════════════════════════════════════
  // 初始化
  // ════════════════════════════════════════════════════════════

  init() {
    this._buildContainer();
    this._buildStyles();
    // 预加载常用场景
    this._preload(['hideout', 'tavern']);
    return this;
  }

  /** 在指定 DOM 元素内挂载，默认挂载到 document.body */
  mount(parentEl = document.body) {
    parentEl.prepend(this._container);
    return this;
  }

  // ════════════════════════════════════════════════════════════
  // 主要公共 API
  // ════════════════════════════════════════════════════════════

  /**
   * 切换场景
   * @param {string} sceneId - 'hideout' | 'tavern' | 'poker' | 'evacuation_win' | ...
   * @param {Object} opts - 可选参数
   * @param {number} opts.fadeMs - 覆盖默认淡入淡出时长
   */
  async transitionTo(sceneId, opts = {}) {
    if (this._currentScene === sceneId) return;
    if (this._transitioning) return;
    if (!this.scenes[sceneId]) {
      console.warn(`[VBM] 未知场景: ${sceneId}`);
      return;
    }

    // poker 场景需要确定当前子状态的视频源
    if (sceneId === 'poker') {
      const state = this.pokerStates[this._currentPokerState];
      this.scenes.poker.src = state.src;
      this.scenes.poker.posterSrc = state.posterSrc;
    }

    this._transitioning = true;
    const scene = this.scenes[sceneId];
    const fadeMs = opts.fadeMs ?? this.options.fadeduration;

    this._emit('beforeTransition', { from: this._currentScene, to: sceneId });

    try {
      await this._crossFade(scene, fadeMs);
      this._currentScene = sceneId;
      this._emit('afterTransition', { scene: sceneId });

      // 撤离场景不循环，结束后触发事件
      if (!scene.loop) {
        this._activeEl.addEventListener('ended', () => {
          this._emit('sceneEnded', { scene: sceneId });
        }, { once: true });
      }

      // 预加载下一个可能的场景
      this._preloadNext(sceneId);
    } finally {
      this._transitioning = false;
    }
  }

  /**
   * 更新牌桌内的视频状态
   * @param {'normal'|'highstakes'|'allin'|'showdown'} state
   */
  async setPokerState(state) {
    if (!this.pokerStates[state]) {
      console.warn(`[VBM] 未知牌桌状态: ${state}`);
      return;
    }
    if (this._currentPokerState === state) return;

    this._currentPokerState = state;

    // 只有当前在牌桌场景时才立即切换视频
    if (this._currentScene === 'poker') {
      const pokerState = this.pokerStates[state];
      this.scenes.poker.src = pokerState.src;
      this._transitioning = false; // 允许状态内切换
      await this._crossFade(
        { ...this.scenes.poker, src: pokerState.src, posterSrc: pokerState.posterSrc },
        this.options.pokerFadeDuration
      );
      this._emit('pokerStateChanged', { state });
    }
  }

  /**
   * 根据底池大小自动判断牌桌状态
   * @param {number} pot - 当前底池筹码量
   */
  updateByPot(pot) {
    if (this._currentScene !== 'poker') return;
    const threshold = this.pokerStates.highstakes.potThreshold ?? 500;
    const newState = pot >= threshold ? 'highstakes' : 'normal';
    if (newState !== this._currentPokerState &&
        !['allin', 'showdown'].includes(this._currentPokerState)) {
      this.setPokerState(newState);
    }
  }

  /**
   * 触发撤离场景，自动根据结果选择分支
   * @param {'win'|'neutral'|'fail'} outcome
   */
  triggerEvacuation(outcome = 'neutral') {
    const map = { win: 'evacuation_win', neutral: 'evacuation_neutral', fail: 'evacuation_fail' };
    const sceneId = map[outcome] ?? 'evacuation_neutral';
    return this.transitionTo(sceneId);
  }

  /**
   * 暂停/恢复当前背景视频（例如游戏暂停菜单）
   */
  pause() { this._activeEl?.pause(); }
  resume() { this._activeEl?.play(); }

  /**
   * 注册事件监听
   * 事件：beforeTransition | afterTransition | sceneEnded | pokerStateChanged
   */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    return this;
  }

  /** 获取当前场景 id */
  get currentScene() { return this._currentScene; }

  /** 获取当前牌桌状态 */
  get currentPokerState() { return this._currentPokerState; }

  // ════════════════════════════════════════════════════════════
  // 内部实现
  // ════════════════════════════════════════════════════════════

  _buildContainer() {
    this._container = document.createElement('div');
    this._container.id = this.options.containerId;

    // 创建两个 video 层，用于交叉淡入淡出
    this._activeEl = this._createVideoEl('vbm-active');
    this._standbyEl = this._createVideoEl('vbm-standby');

    this._container.appendChild(this._activeEl);
    this._container.appendChild(this._standbyEl);
  }

  _createVideoEl(className) {
    const el = document.createElement('video');
    el.className = `vbm-video ${className}`;
    el.autoplay = true;
    el.muted = true;           // 必须 muted 才能自动播放
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    return el;
  }

  _buildStyles() {
    if (document.getElementById('vbm-styles')) return;
    const style = document.createElement('style');
    style.id = 'vbm-styles';
    style.textContent = `
      #${this.options.containerId} {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
      }

      .vbm-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity var(--vbm-fade, 500ms) ease-in-out;
      }

      .vbm-video.vbm-active  { opacity: 1; }
      .vbm-video.vbm-standby { opacity: 0; }
    `;
    document.head.appendChild(style);
  }

  async _crossFade(scene, fadeMs = this.options.fadeMs) {
    const fadeDuration = fadeMs ?? this.options.fadesDuration ?? 500;

    // 更新 CSS 变量控制过渡时长
    this._container.style.setProperty('--vbm-fade', `${fadeDuration}ms`);

    // 待机层加载新视频
    const standby = this._standbyEl;
    standby.src = scene.src;
    if (scene.posterSrc) standby.poster = scene.posterSrc;
    standby.loop = scene.loop ?? true;
    standby.volume = scene.volume ?? 0;

    // 等待视频可以播放
    await this._waitCanPlay(standby);
    standby.play().catch(() => {});

    // 交叉淡入淡出：standby 变 active，active 变 standby
    standby.classList.remove('vbm-standby');
    standby.classList.add('vbm-active');
    this._activeEl.classList.remove('vbm-active');
    this._activeEl.classList.add('vbm-standby');

    // 等待过渡完成后清理旧视频
    await this._wait(fadeDuration);
    this._activeEl.pause();
    this._activeEl.removeAttribute('src');
    this._activeEl.load();

    // 交换引用
    [this._activeEl, this._standbyEl] = [this._standbyEl, this._activeEl];
  }

  _waitCanPlay(videoEl, timeout = 5000) {
    return new Promise((resolve) => {
      if (videoEl.readyState >= 3) { resolve(); return; }

      const onCanPlay = () => { clearTimeout(timer); resolve(); };
      const timer = setTimeout(() => {
        videoEl.removeEventListener('canplay', onCanPlay);
        console.warn('[VBM] 视频加载超时，强制继续');
        resolve();
      }, timeout);

      videoEl.addEventListener('canplay', onCanPlay, { once: true });
    });
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _emit(event, data = {}) {
    (this._listeners[event] || []).forEach(fn => {
      try { fn(data); } catch (e) { console.error('[VBM] 事件处理器出错:', e); }
    });
  }

  /** 预加载指定场景的视频（不播放） */
  _preload(sceneIds) {
    sceneIds.forEach(id => {
      const scene = this.scenes[id];
      if (!scene?.src || this._preloadQueue.has(id)) return;
      this._preloadQueue.add(id);

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = scene.src;
      document.head.appendChild(link);
    });
  }

  /** 根据当前场景预判下一个可能的场景并预加载 */
  _preloadNext(currentSceneId) {
    const nextMap = {
      hideout:           ['tavern'],
      tavern:            ['poker', 'evacuation_win', 'evacuation_neutral', 'evacuation_fail'],
      poker:             ['tavern'],
      evacuation_win:    [],
      evacuation_neutral:[],
      evacuation_fail:   [],
    };
    this._preload(nextMap[currentSceneId] || []);
  }
}


// ════════════════════════════════════════════════════════════
// 使用示例（实际接入时删除此部分）
// ════════════════════════════════════════════════════════════

/*

// 1. 初始化并挂载
const vbm = new VideoBackgroundManager({
  fadesDuration: 500,
  pokerFadeDuration: 800,
}).init().mount(document.body);

// 2. 监听事件
vbm.on('afterTransition', ({ scene }) => {
  console.log(`场景切换完成: ${scene}`);
});

vbm.on('sceneEnded', ({ scene }) => {
  // 撤离视频播完后回到主菜单或重新开始
  if (scene.startsWith('evacuation')) {
    showGameOverScreen();
  }
});

// 3. 场景切换（按游戏流程调用）

// 游戏开始 → 藏匿点
vbm.transitionTo('hideout');

// 玩家进入酒馆
vbm.transitionTo('tavern');

// 玩家坐下打牌
vbm.transitionTo('poker');

// 底池更新时自动调整牌桌氛围（在每次 pot 变化时调用）
vbm.updateByPot(gameState.pot);

// All-in 发生时
vbm.setPokerState('allin');

// 摊牌时
vbm.setPokerState('showdown');

// 一局结束，回到酒馆
vbm.setPokerState('normal');   // 重置牌桌状态
vbm.transitionTo('tavern');

// 触发撤离（根据胜负结果）
vbm.triggerEvacuation('win');    // 或 'neutral' / 'fail'

*/
