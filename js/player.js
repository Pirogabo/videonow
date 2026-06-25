/* ================================================================
   VIDEONOW — PLAYER MODULE
   Shaka Player (HLS/DASH/MP4) + soporte de subtítulos:
     - WebVTT/SRT  → pistas nativas de <video> (track del navegador)
     - ASS/SSA     → renderizado con libass-wasm (JS SubtitlesOctopus)
                      superpuesto en canvas sobre el video

   Pipeline esperado en el servidor (ver SETUP.md):
     MKV original → FFmpeg → HLS (.m3u8) → Shaka Player → Octopus (si hay .ass)

   Uso:
     VideoNowPlayer.mount('#player-wrap', {
       src: 'https://tu-cdn.com/videos/abc/master.m3u8',
       poster: 'https://tu-cdn.com/videos/abc/thumb.jpg',
       subtitles: [
         { lang: 'es', label: 'Español', kind: 'vtt', url: '...subs_es.vtt' },
         { lang: 'es', label: 'Español (ASS)', kind: 'ass', url: '...subs_es.ass' }
       ]
     });
   ================================================================ */

const VideoNowPlayer = (() => {

  const CDN = {
    shaka:   'https://cdn.jsdelivr.net/npm/shaka-player@4.9.3/dist/shaka-player.compiled.js',
    octopus: 'https://cdn.jsdelivr.net/npm/libass-wasm@4.1.0/dist/js/subtitles-octopus.js',
    octopusWorker: 'https://cdn.jsdelivr.net/npm/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.js',
  };

  let scriptsLoaded = { shaka: false, octopus: false };
  let shakaPlayerInstance = null;
  let octopusInstance = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureShaka() {
    if (scriptsLoaded.shaka) return;
    await loadScript(CDN.shaka);
    scriptsLoaded.shaka = true;
  }

  async function ensureOctopus() {
    if (scriptsLoaded.octopus) return;
    await loadScript(CDN.octopus);
    scriptsLoaded.octopus = true;
  }

  function destroy() {
    if (octopusInstance) {
      try { octopusInstance.dispose(); } catch (e) {}
      octopusInstance = null;
    }
    if (shakaPlayerInstance) {
      try { shakaPlayerInstance.destroy(); } catch (e) {}
      shakaPlayerInstance = null;
    }
  }

  /**
   * Monta el player dentro del contenedor indicado.
   * options: { src, poster, subtitles: [{lang,label,kind:'vtt'|'srt'|'ass',url,default}] }
   */
  async function mount(containerSelector, options) {
    destroy();
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!container) return;

    container.innerHTML = `
      <video id="vn-video" playsinline style="position:absolute;inset:0;width:100%;height:100%;background:#000;" ${options.poster ? `poster="${escapeAttr(options.poster)}"` : ''}></video>
      <div id="vn-player-status" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#888;font-size:13px;background:rgba(0,0,0,0.0);pointer-events:none;"></div>
    `;

    const video = container.querySelector('#vn-video');
    const status = container.querySelector('#vn-player-status');
    setStatus(status, 'Cargando reproductor…');

    try {
      await ensureShaka();

      if (!window.shaka.Player.isBrowserSupported()) {
        setStatus(status, 'Tu navegador no soporta este reproductor. Prueba con Chrome, Firefox o Edge actualizados.');
        return;
      }

      const player = new window.shaka.Player();
      await player.attach(video);
      shakaPlayerInstance = player;

      player.addEventListener('error', (e) => {
        console.error('Shaka error:', e.detail);
        setStatus(status, 'No se pudo cargar el video. Revisa la URL de origen (HLS/DASH/MP4).');
      });

      // Pistas de texto nativas (WebVTT / SRT ya convertido a VTT)
      const vttSubs = (options.subtitles || []).filter(s => s.kind === 'vtt' || s.kind === 'srt');
      const assSubs = (options.subtitles || []).filter(s => s.kind === 'ass' || s.kind === 'ssa');

      await player.load(options.src);
      setStatus(status, '');
      video.controls = true;

      vttSubs.forEach(sub => {
        try {
          player.addTextTrackAsync(sub.url, sub.lang || 'es', 'subtitle', 'text/vtt', '', sub.label || sub.lang)
            .catch(() => {});
        } catch (e) { /* no-op si el navegador no soporta esto aún */ }
      });

      // Si hay subtítulos ASS/SSA, montamos el overlay de libass-wasm SOLO en ese caso
      // (ver patrón "ASS solo cuando haga falta" — evita cargar el wasm si no es necesario)
      if (assSubs.length > 0) {
        await ensureOctopus();
        const primary = assSubs.find(s => s.default) || assSubs[0];
        octopusInstance = new window.SubtitlesOctopus({
          video: video,
          subUrl: primary.url,
          workerUrl: CDN.octopusWorker,
          fonts: [],            // añade URLs de fuentes embebidas del MKV original si las tienes
          lossyRender: true,
          renderMode: 'wasm-blend',
        });
      }

      return { player, video, octopus: octopusInstance };

    } catch (err) {
      console.error('Error iniciando el player:', err);
      setStatus(status, 'Error cargando el video. ' + (err.message || ''));
    }
  }

  function setStatus(el, text) {
    if (!el) return;
    el.textContent = text;
    el.style.background = text ? 'rgba(0,0,0,0.5)' : 'transparent';
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  return { mount, destroy };
})();
