const DEFAULT_FADE_MS = 650;

export const VIDEO_BACKGROUND_FILES = {
  menu: "menu-title-bg",
  stash: "stash-loop",
  "tavern-smoky-den": "tavern-smoky-den-bg",
  "tavern-high-rise-suite": "tavern-high-rise-suite-bg",
  "tavern-rooftop-club": "tavern-rooftop-club-bg",
  "tavern-neon-poker-club": "tavern-neon-poker-club-bg",
  "poker-table-normal": "poker-table-normal",
  "poker-table-highstakes": "poker-table-highstakes",
  "poker-table-allin": "poker-table-allin",
  "poker-table-showdown": "poker-table-showdown",
  "extraction-success": "extraction-success",
  "extraction-failure": "extraction-failure",
};

const DEFAULT_VIDEO_STEMS = { ...VIDEO_BACKGROUND_FILES };

export function createVideoBackgroundManager(options = {}) {
  return new CanvasVideoBackgroundManager(options);
}

class CanvasVideoBackgroundManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? "../assets/videos/";
    this.manifestUrl = options.manifestUrl ?? `${this.baseUrl}manifest.json`;
    this.fadeMs = options.fadeMs ?? DEFAULT_FADE_MS;
    this.lastTick = 0;
    this.active = null;
    this.previous = null;
    this.cache = new Map();
    this.warmQueue = new Set();
    this.manifestLoaded = false;
    this.enabled = false;
    this.availableKeys = new Set();
    this.availableFiles = new Map();
    this.loadManifest();
  }

  setKey(key, now = performance.now()) {
    if (!key || !VIDEO_BACKGROUND_FILES[key] || !this.isAvailable(key)) {
      this.active = null;
      this.previous = null;
      return;
    }
    if (this.active?.key === key) {
      return;
    }

    const entry = this.ensureEntry(key);
    if (!entry || entry.failed) {
      this.active = null;
      this.previous = null;
      return;
    }

    this.previous = this.active && this.active.entry?.canDraw() ? { ...this.active, startedAt: now } : null;
    this.active = { key, entry, startedAt: now };
    entry.play();
    this.warmLikelyNext(key);
  }

  draw(ctx, crop, target, now = performance.now()) {
    if (!this.active?.entry?.canDraw()) {
      return false;
    }

    const elapsed = Math.max(0, now - this.active.startedAt);
    const progress = this.fadeMs > 0 ? Math.min(1, elapsed / this.fadeMs) : 1;

    if (this.previous?.entry?.canDraw() && progress < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      drawCoverVideo(ctx, this.previous.entry.video, crop, target);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = progress;
    drawCoverVideo(ctx, this.active.entry.video, crop, target);
    ctx.restore();

    if (progress >= 1) {
      this.previous = null;
    }
    return true;
  }

  ensureEntry(key) {
    if (!this.isAvailable(key)) {
      return null;
    }
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const filename = this.availableFiles.get(key);
    if (!filename) {
      return null;
    }

    const entry = new VideoEntry(key, filename, this.baseUrl);
    this.cache.set(key, entry);
    return entry;
  }

  warm(keys) {
    keys.forEach((key) => {
      if (!VIDEO_BACKGROUND_FILES[key] || this.warmQueue.has(key)) {
        return;
      }
      this.warmQueue.add(key);
      this.ensureEntry(key)?.load();
    });
  }

  warmLikelyNext(key) {
    const nextMap = {
      menu: ["stash"],
      stash: ["tavern-smoky-den", "tavern-high-rise-suite", "tavern-rooftop-club", "tavern-neon-poker-club"],
      "tavern-smoky-den": ["poker-table-normal", "extraction-success", "extraction-failure"],
      "tavern-high-rise-suite": ["poker-table-normal", "extraction-success", "extraction-failure"],
      "tavern-rooftop-club": ["poker-table-normal", "extraction-success", "extraction-failure"],
      "tavern-neon-poker-club": ["poker-table-normal", "extraction-success", "extraction-failure"],
      "poker-table-normal": ["poker-table-highstakes", "poker-table-allin", "poker-table-showdown"],
      "poker-table-highstakes": ["poker-table-allin", "poker-table-showdown"],
      "poker-table-allin": ["poker-table-showdown"],
      "poker-table-showdown": ["tavern-smoky-den", "extraction-success", "extraction-failure"],
    };
    this.warm(nextMap[key] ?? []);
  }

  isAvailable(key) {
    return this.manifestLoaded && this.enabled && this.availableKeys.has(key);
  }

  async loadManifest() {
    try {
      const response = await fetch(this.manifestUrl, { cache: "no-store" });
      if (!response.ok) {
        this.manifestLoaded = true;
        return;
      }
      const manifest = await response.json();
      this.enabled = Boolean(manifest.enabled);
      this.availableKeys = new Set(Array.isArray(manifest.available) ? manifest.available : []);
      const files = manifest.files && typeof manifest.files === "object" ? manifest.files : {};
      this.availableFiles = new Map(
        [...this.availableKeys]
          .map((key) => {
            const filename = typeof files[key] === "string" ? files[key] : null;
            if (filename) {
              return [key, filename];
            }
            const stem = DEFAULT_VIDEO_STEMS[key];
            return stem ? [key, `${stem}.webm`] : null;
          })
          .filter(Boolean),
      );
    } catch {
      this.enabled = false;
      this.availableKeys = new Set();
      this.availableFiles = new Map();
    } finally {
      this.manifestLoaded = true;
    }
  }
}

class VideoEntry {
  constructor(key, filename, baseUrl) {
    this.key = key;
    this.filename = filename;
    this.baseUrl = baseUrl;
    this.failed = false;
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.crossOrigin = "anonymous";
    this.video.setAttribute("playsinline", "");
    this.video.addEventListener("error", () => {
      this.failed = true;
    }, { passive: true });
  }

  load() {
    if (this.video.src || this.failed) {
      return;
    }
    this.applySource();
  }

  play() {
    this.load();
    if (this.failed) {
      return;
    }
    this.video.play().catch(() => {
      // Muted inline video should autoplay; if a browser still blocks it, the PNG fallback remains active.
    });
  }

  canDraw() {
    return !this.failed && this.video.readyState >= 2 && this.video.videoWidth > 0 && this.video.videoHeight > 0;
  }

  applySource() {
    this.video.src = `${this.baseUrl}${this.filename}`;
    this.video.load();
  }
}

function drawCoverVideo(ctx, video, crop = {}, target = {}) {
  let sx = crop.x ?? 0;
  let sy = crop.y ?? 0;
  let sw = crop.w ?? video.videoWidth;
  let sh = crop.h ?? video.videoHeight;
  const dx = target.x ?? 0;
  const dy = target.y ?? 0;
  const dw = target.w ?? 360;
  const dh = target.h ?? 225;
  const targetAspect = dw / dh;
  const sourceAspect = sw / sh;

  if (sourceAspect > targetAspect) {
    const adjustedW = sh * targetAspect;
    sx += (sw - adjustedW) / 2;
    sw = adjustedW;
  } else if (sourceAspect < targetAspect) {
    const adjustedH = sw / targetAspect;
    sy += (sh - adjustedH) / 2;
    sh = adjustedH;
  }

  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}
