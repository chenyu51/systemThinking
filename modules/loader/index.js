window.CanvasModuleLoader = {
  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  },

  async loadGroup(sources = []) {
    for (const src of sources) {
      await this.loadScript(src);
    }
  },

  async loadAll(manifest = window.CANVAS_MODULE_MANIFEST || {}) {
    for (const group of ['i18n', 'data', 'models', 'canvas', 'ai', 'panel']) {
      await this.loadGroup(manifest[group]);
    }
  },

  async bootstrap() {
    if (this.bootstrapped) return;
    this.bootstrapped = true;
    await this.loadAll();
    if (typeof window.initializeCanvasApp !== 'function') {
      throw new Error('initializeCanvasApp is not available after module load');
    }
    window.initializeCanvasApp();
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.CanvasModuleLoader.bootstrap();
  } catch (error) {
    console.error('Canvas app bootstrap failed:', error);
  }
});
