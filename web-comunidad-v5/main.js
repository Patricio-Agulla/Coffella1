/* =========================================================
   Coffella · Comunidad v5 (v3 + marca de coffella.vercel.app): datos, interacción, precarga y motion
   Parámetros de URL para revisar estados:
     ?static            sin animaciones ni precarga (capturas)
     ?frame             viewport fijo (capturas de diálogos)
     ?noload            sin precarga, con la entrada corta del hero
     ?open=menu|signup|signup-2|signup-3|login|video|invite
     ?role=a|b|c        rol preseleccionado en el registro
     ?user=1            simula una cuenta con 3 sellos
     ?noinvite          no muestra la invitación
     ?carnet=3|4|8|pour carnet de ejemplo con N sellos (pour: sirviendo la 4ª visita)
     ?only=carnet       solo la sección del carnet (capturas)
     ?errors            con open=signup-2, muestra los errores del paso 2
     ?reset             borra el estado guardado
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  // El JS se hace cargo de la precarga: se apaga la salida de emergencia por CSS.
  root.classList.add('loader-js');
  // Salida única de la intro. Si no terminó en 12 s (pestaña muy lenta o un error a mitad
  // de camino) o la pestaña se oculta, corta las animaciones y deja el hero en su estado final.
  const HERO_ANIM = '.hero__title, .hero__title .w, [data-hero-panel], [data-hero-in], #hdr, [data-cup="hero"]';
  let introOver = false;
  let afterIntroHook = null;
  function endIntroNow() {
    if (introOver) return;
    introOver = true;
    clearTimeout(emergency);
    if (window.gsap) gsap.killTweensOf(document.querySelectorAll(`${HERO_ANIM}, [data-loader], [data-loader] *`));
    root.classList.remove('is-loading');
    const l = document.querySelector('[data-loader]');
    if (l) l.remove();
    document.querySelectorAll(HERO_ANIM).forEach((el) => el.removeAttribute('style'));
    if (afterIntroHook) afterIntroHook();
  }
  const emergency = setTimeout(endIntroNow, 12000);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const STATIC = root.classList.contains('is-static');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOTION = !!(window.gsap && window.ScrollTrigger) && !STATIC && !REDUCED;
  if (MOTION) gsap.registerPlugin(ScrollTrigger);
  else root.classList.remove('js-motion', 'is-loading');

  /* ---------------- Utilidades ---------------- */
  // Fotos de la colección de Cosmos indicada por el cliente (referencia para el prototipo).
  const CO = (id, w = 900) => `https://cdn.cosmos.so/${id}?format=webp&w=${w}`;
  const U = (id, w, h, q = 75) => `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=${q}&auto=format`;
  const fmt = (n) => Math.round(n).toLocaleString('es-AR');
  const money = (n) => '$ ' + fmt(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const mq = (q) => matchMedia(q).matches;
  const smooth = () => (REDUCED ? 'auto' : 'smooth');

  const store = {
    get(k, d) { try { const v = localStorage.getItem('coffella-com5:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('coffella-com5:' + k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith('coffella-com5:')).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* nada */ } },
  };
  if (params.has('reset')) store.clear();

  /* ---------------- Datos ---------------- */
  const ROLES = [
    { role: 'a', who: 'Para quienes toman café', name: 'Tomo café', text: 'Mapa de cafeterías, carnet de sellos y catas para descubrir una barra nueva cada semana.', perks: ['Gratis', 'Carnet con sellos y premios', 'Catas gratis para miembros', '10 % off en la tienda'], cta: 'Sumarme' },
    { role: 'b', who: 'Para quienes preparan café', name: 'Preparo café', text: 'Perfil de barista, throwdowns de latte art y búsquedas de cafeterías del Club.', perks: ['Gratis', 'Perfil de barista visible', 'Throwdowns y talleres', 'Búsquedas de las barras del Club'], cta: 'Crear mi perfil' },
    { role: 'c', who: 'Para quienes sirven café', name: 'Tengo una cafetería', text: 'Tu barra en el mapa, juntadas propias y gente que vuelve por su sello.', perks: ['Sin costo', 'Ficha en el mapa del Club', 'Juntadas en tu barra', 'Visitas que suman sellos'], cta: 'Sumar mi cafetería' },
    { role: '', who: 'Para todo el Club', name: 'El Club completo', text: 'Carnet, juntadas, notas, La Semanal y 10 % off en la tienda, todo junto.', perks: ['Gratis', 'La Semanal todos los jueves', 'Notas y videos de la comunidad', 'Reservas en un toque'], cta: 'Sumarme al Club' },
  ];

  const SHARE = [
    { name: 'Carnet de sellos', img: '5df51731-3024-4985-93dd-d15bb5541df2', alt: 'Clientes conversan en la barra de una cafetería con plantas', text: 'Un sello por cada visita a una cafetería del Club: taza de regalo en la 4ª y cata para dos en la 8ª. Con rutas por barrio y sellos especiales.', link: '<button class="btn btn--light btn--sm" type="button" data-passport-cta>Activar mi carnet</button>', cls: 'tile--tall' },
    { name: 'Catas abiertas', img: '01a1542a-b934-7df9-bf00-3a58ecb4ad2e', alt: 'Tazas de cata servidas sobre una mesa oscura', text: 'Cada semana en una barra distinta: tres orígenes, tres métodos y nadie que te tome examen. Gratis para miembros.', link: '<a class="btn btn--light btn--sm" href="#juntadas">Ver las juntadas</a>' },
    { name: 'Talleres', img: 'images/01a15a9c-9706-7b54-899f-25d416172477', alt: 'Baristas trabajan juntos detrás de una barra, vistos desde arriba', text: 'Filtro en casa, molienda y latte art, en grupos chicos y con precio de miembro.', link: '<a class="btn btn--light btn--sm" href="#juntadas">Ver próximos talleres</a>' },
    { name: 'Throwdowns', img: '3609dc09-75ad-4974-88d0-59d9d8a0fa67', alt: 'Baristas preparan café en una barra luminosa', text: 'Una jarra, una hora y baristas de toda la ciudad. Mirar es gratis; para competir, armá tu perfil.', link: '<button class="btn btn--light btn--sm" type="button" data-join="b">Crear mi perfil de barista</button>' },
    { name: 'La Semanal', img: '', alt: '', text: 'Un mail por semana con aperturas, notas y la agenda de juntadas. Sin spam, con mucho café.', link: '<button class="btn btn--ink btn--sm" type="button" data-join>Suscribirme</button>', cls: 'tile--semanal' },
  ];

  // Avatares recortados de las fotos (z = zoom, fx/fy = centro de la cara, r = alto/ancho).
  const AVATARS = [
    { src: 'assets/img/hero-1470.webp', z: 12, fx: 0.613, fy: 0.445, r: 980 / 1470 },
    { src: CO('b4d20e49-fc81-4ccd-ad7a-c51ea3b268ed', 700), z: 7, fx: 0.45, fy: 0.47, r: 1.25 },
    { src: CO('db67d42c-f044-4ccb-8297-dd696c7d3e75', 700), z: 6.2, fx: 0.43, fy: 0.49, r: 1440 / 1080 },
    { src: 'assets/img/hero-1470.webp', z: 12, fx: 0.795, fy: 0.385, r: 980 / 1470 },
  ];

  // Cafeterías de ejemplo (nombres ficticios en barrios reales de Córdoba).
  const CAFES = [
    { id: 'tertulia', name: 'Tertulia', barrio: 'Güemes', addr: 'Belgrano 700', lat: -31.4232, lng: -64.1932, ph: '0279f2b2-19ef-4cda-81f8-12a8f4179588', tags: ['tostado', 'pet'], wk: [8, 20], sun: [9, 14] },
    { id: 'barra', name: 'Barra Norte', barrio: 'Alta Córdoba', addr: 'Jerónimo L. de Cabrera 900', lat: -31.3925, lng: -64.1788, ph: 'f539b953-746f-4ce2-b2e2-3d0b39ade7dd', tags: ['trabajar'], wk: [7.5, 19], sun: null },
    { id: 'molino', name: 'Molino', barrio: 'Alberdi', addr: 'Av. Colón 1500', lat: -31.4095, lng: -64.2035, ph: '263100d1-86be-466a-a1e8-e1f5e0a8fe51', tags: ['tostado'], wk: [8, 18], sun: null },
    { id: 'pausa', name: 'Pausa', barrio: 'Nueva Córdoba', addr: 'Obispo Trejo 900', lat: -31.4272, lng: -64.1842, ph: '68ed69af-e753-433e-be48-b0e67a28f186', tags: ['trabajar'], wk: [8, 21], sun: [10, 20] },
    { id: 'filtro', name: 'Filtro', barrio: 'Cofico', addr: 'Fragueiro 1100', lat: -31.4032, lng: -64.1884, ph: '5fbd2dfc-e087-4243-98f3-9c15c44f0c36', tags: ['pet', 'trabajar'], wk: [8.5, 19.5], sun: [9, 13] },
    { id: 'lenta', name: 'La Taza Lenta', barrio: 'Cerro de las Rosas', addr: 'Av. Rafael Núñez 4300', lat: -31.3698, lng: -64.2305, ph: 'ff5ca8a6-6d42-4fdf-9cd8-a0fad9d11568', tags: ['pet'], wk: [9, 20], sun: [9, 20] },
    { id: 'grano', name: 'Grano', barrio: 'Observatorio', addr: 'Laprida 1200', lat: -31.4262, lng: -64.2052, ph: 'images/9a5368ec-62a5-468d-bd4e-be1352e37016', tags: ['tostado', 'trabajar'], wk: [8, 19], sun: null },
    { id: 'tercer', name: 'Tercer Lugar', barrio: 'General Paz', addr: '25 de Mayo 1300', lat: -31.4105, lng: -64.1690, ph: '12fc5b86-6028-45e7-8165-4bcbed90d945', tags: ['trabajar', 'pet'], wk: [8, 22], sun: [16, 22] },
    { id: 'barrio', name: 'Barrio Café', barrio: 'Jardín', addr: 'Av. Richieri 3000', lat: -31.4495, lng: -64.1800, ph: 'd8245da7-f663-4c23-acf5-62b28e60c70f', tags: ['pet'], wk: [8, 20], sun: [9, 13] },
    { id: 'sobremesa', name: 'Sobremesa', barrio: 'Centro', addr: 'Deán Funes 200', lat: -31.4155, lng: -64.1858, ph: '4ccff2fa-0ac0-4914-88e6-35337bdb1817', tags: ['trabajar'], wk: [7, 20], sun: null },
    { id: 'calma', name: 'Calma', barrio: 'Villa Belgrano', addr: 'Av. Gauss 5800', lat: -31.3540, lng: -64.2460, ph: '70ab9174-274f-451a-8e40-91a38a96b21b', tags: ['tostado', 'pet'], wk: [9, 19], sun: [9, 19] },
    { id: 'origen', name: 'Origen', barrio: 'Güemes', addr: 'Fructuoso Rivera 300', lat: -31.4318, lng: -64.1978, ph: '556b8c0d-e844-4d60-878b-67b360637a96', tags: ['tostado'], wk: [8, 20], sun: [10, 18] },
  ];
  const TAG_NAME = { tostado: 'Tuestan', trabajar: 'Para trabajar', pet: 'Pet friendly' };

  const EVENTS = [
    { id: 'cata', dow: 'sáb', day: '31', mon: 'oct', time: '18 h', title: 'Cata abierta: tres orígenes, tres métodos', place: 'En Tertulia', price: 'Gratis para miembros', spots: 6, img: 'f8a2b6a6-25b0-475c-8db1-3227e1a37089' },
    { id: 'throwdown', dow: 'vie', day: '6', mon: 'nov', time: '20 h', title: 'Throwdown de latte art', place: 'En Barra Norte', price: 'Gratis · inscripción de baristas abierta', spots: 22, img: '3c20820e-6833-4e01-a9f8-d0dd770c0cae' },
    { id: 'filtro', dow: 'sáb', day: '7', mon: 'nov', time: '10:30 h', title: 'Taller de filtro en casa', place: 'En Molino', price: '$ 8.000 · miembros $ 7.200', spots: 3, img: 'aee8b27f-c9ee-4607-bab3-456a10c61602' },
    { id: 'caminata', dow: 'dom', day: '15', mon: 'nov', time: '9:30 h', title: 'Juntada de barrio: cuatro barras a pie', place: 'Salida desde Origen', price: 'Gratis · suma 3 sellos', spots: 14, img: '7b05b960-dbae-4837-8bf0-a5ec46c69080' },
  ];

  const POSTS = [
    { id: 'trabajar', cat: 'Guías', min: 6, title: 'Cinco cafeterías para trabajar con la compu abierta', img: '7db4c00b-9408-47ac-a2ef-58303ec1c3d7', by: 'Juli Ferreyra' },
    { id: 'cata', cat: 'Aprender', min: 4, title: 'Qué es una cata y por qué no hace falta saber nada para ir', img: 'aef07eb3-3e87-4112-9049-86757ffb7a1f', by: 'Tomi Aguirre' },
    { id: 'ruta', cat: 'Rutas', min: 5, title: 'Cuatro barras de barrio en una mañana', img: '8df4070f-c46b-42c5-9544-1b94e297bab2', by: 'Equipo Coffella' },
    { id: 'barra', cat: 'Personas', min: 7, title: 'Detrás de la barra: un día con una barista del Club', img: '187e5ee3-716d-4700-97cb-1a8728d66796', by: 'Juli Ferreyra' },
  ];

  const VIDEOS = [
    { id: 'throwdown', title: 'Así fue el último throwdown del Club', dur: '3:05', meta: '8 mil vistas · hace 1 mes', src: 'https://videos.pexels.com/video-files/5301066/5301066-sd_540_782_24fps.mp4', thumb: '6c9c54d1-bdca-473f-ba03-80418707d874' },
    { id: 'molienda', title: 'Cómo moler para cada método', dur: '4:12', meta: '12 mil vistas · hace 3 días', src: '../web/assets/media/barista-1080.mp4', thumb: '299bf9b1-200f-4257-a511-d612ba29a889' },
    { id: 'v60', title: 'V60 paso a paso, sin balanza', dur: '6:30', meta: '31 mil vistas · hace 2 semanas', src: 'https://videos.pexels.com/video-files/7125320/7125320-sd_540_960_25fps.mp4', thumb: 'f794fb43-0b41-4daf-945e-0421d5b1f83a' },
  ];

  const PRODUCTS = [
    { id: 'frutal', name: 'Coffella Frutal', meta: 'Etiopía · Yirgacheffe', price: 12900, img: 'photo-1695245503558-5cdb37f49092', alt: 'Bolsa de papel kraft de café sobre una mesa clara' },
    { id: 'kit', name: 'Kit degustación', meta: '3 orígenes · 100 g c/u', price: 15900, compare: 18600, img: 'photo-1780660231448-7f0aa4d236e9', alt: 'Varias bolsas de café de papel kraft con etiquetas' },
    { id: 'taza', name: 'Taza Piedra', meta: 'Cerámica hecha a mano', price: 18500, img: 'photo-1666445844615-0a3930270f13', alt: 'Taza de cerámica moteada sobre un estante blanco' },
    { id: 'dripper', name: 'Dripper cónico 02', meta: 'Cerámica · 1 a 4 tazas', price: 32000, img: 'photo-1771430831314-ac11672c5f77', alt: 'Dripper cónico naranja junto a tazas y utensilios' },
  ];

  // Sellos: cada visita llena una taza (el isotipo).
  const DEMO_STAMPS = [{ cafe: 'Tertulia' }, { cafe: 'Filtro' }, { cafe: 'Pausa' }];
  const DEMO_NEXT = ['Origen', 'Molino', 'Calma', 'Sobremesa', 'Grano'];

  /* ---------------- Estado de cuenta ---------------- */
  let user = store.get('user', null);
  if (params.get('user') === '1' && !user) user = { name: 'Martina', email: 'martina@mail.com', role: 'a', stamps: DEMO_STAMPS, news: true };
  const setUser = (u) => { user = u; store.set('user', u); renderUser(); };
  const rsvps = () => (user ? store.get('rsvp', []) : []);

  /* =========================================================
     La taza (isotipo). Un solo bucle para todas las tazas visibles.
     - Mira con inercia (resorte amortiguado): nunca salta.
     - Prioridad: lo que enfocás o señalás > el campo donde escribís > el puntero > mirar alrededor.
     - Parpadea cada 3 a 7 s; puede dormir, despertarse, leer y "sonreír".
     ========================================================= */
  const CUPS = [];
  const pointer = { x: 0, y: 0, t: -1e9 };
  let lookEl = null;
  const TYPING = 'input:not([type="radio"]):not([type="checkbox"])';
  const rand = (a, b) => a + Math.random() * (b - a);

  class Cup {
    constructor(svg, { asleep = false } = {}) {
      this.svg = svg;
      this.name = svg.dataset.cup;
      this.eyes = $$('[data-eye]', svg).map((g) => ({ g, p: $('[data-pupil]', g) }));
      this.lids = $('[data-lids]', svg);
      this.lidPaths = $$('path', this.lids).map((p) => p.getAttribute('d'));
      this.rest = { x: -13, y: -2 }; // como el isotipo: mirada apenas hacia el asa
      this.pos = { ...this.rest };
      this.tgt = { ...this.rest };
      this.open = asleep ? 0 : 1;
      this.openTo = this.open;
      this.blinkAt = performance.now() + rand(2400, 5200);
      this.blinkT = -1;
      this.saccadeAt = 0;
      this.hold = null;
      this.visible = true;
      this.alive = MOTION;
      svg.classList.toggle('is-asleep', asleep);
      this.draw();
      CUPS.push(this);
    }
    eyeCenter() {
      const m = this.svg.getScreenCTM();
      return m ? { x: m.a * 626 + m.c * 492 + m.e, y: m.b * 626 + m.d * 492 + m.f } : null;
    }
    aimAt(x, y) {
      const c = this.eyeCenter();
      if (!c) return;
      const dx = x - c.x; const dy = y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 280);
      this.tgt = { x: (dx / d) * 23 * reach, y: (dy / d) * 19 * reach };
    }
    aimAtEl(el) { const r = el.getBoundingClientRect(); this.aimAt(r.left + r.width / 2, r.top + r.height / 2); }
    look(el, ms = 1200) {
      if (!el) return;
      this.hold = { el, until: performance.now() + ms };
      if (!this.alive) { this.aimAtEl(el); this.pos = { ...this.tgt }; this.draw(); }
    }
    // Lee: recorre las palabras con la mirada, una por una.
    read(words, then) {
      if (!this.alive) { if (then) then(); return; }
      words.forEach((w, i) => setTimeout(() => this.look(w, 420), i * 300));
      setTimeout(() => { if (then) then(); }, words.length * 300 + 260);
    }
    blink() { if (this.open > .5 && this.blinkT < 0) this.blinkT = 0; }
    sleep() { this.openTo = 0; this.svg.classList.add('is-asleep'); }
    wake() {
      this.openTo = 1;
      this.svg.classList.remove('is-asleep');
      if (!this.alive) { this.open = 1; this.draw(); }
    }
    smile(ms = 1800) {
      this.setLids(true);
      this.openTo = 0;
      this.svg.classList.add('is-asleep');
      if (!this.alive) { this.open = 0; this.draw(); }
      clearTimeout(this.smileT);
      this.smileT = setTimeout(() => { this.setLids(false); this.wake(); }, ms);
    }
    setLids(up) {
      $$('path', this.lids).forEach((p, i) => p.setAttribute('d', up ? this.lidPaths[i].replace(/Q(\d+),530/, 'Q$1,452').replace(/,494/g, ',500') : this.lidPaths[i]));
    }
    update(dt, now) {
      const typing = document.activeElement && document.activeElement.matches(TYPING) ? document.activeElement : null;
      if (this.hold && now < this.hold.until && this.hold.el.isConnected) this.aimAtEl(this.hold.el);
      else if (lookEl && lookEl.isConnected) this.aimAtEl(lookEl);
      else if (typing) this.aimAtEl(typing);
      else if (now - pointer.t < 3500) this.aimAt(pointer.x, pointer.y);
      else if (now > this.saccadeAt) {
        const a = Math.random() * Math.PI * 2; const r = Math.random() < .35 ? 0 : rand(6, 18);
        this.tgt = Math.random() < .3 ? { ...this.rest } : { x: Math.cos(a) * r, y: Math.sin(a) * r * .7 };
        this.saccadeAt = now + rand(1400, 3400);
      }
      const k = 1 - Math.pow(1 - 0.085, dt / 16.67);
      this.pos.x += (this.tgt.x - this.pos.x) * k;
      this.pos.y += (this.tgt.y - this.pos.y) * k;
      this.open += (this.openTo - this.open) * (1 - Math.pow(1 - 0.12, dt / 16.67));
      if (Math.abs(this.openTo - this.open) < .002) this.open = this.openTo;
      if (this.openTo === 1 && now > this.blinkAt && this.blinkT < 0) {
        this.blinkT = 0;
        this.blinkAt = now + (Math.random() < .2 ? 260 : rand(3000, 6800));
      }
      let s = this.open;
      if (this.blinkT >= 0) {
        this.blinkT += dt / 190;
        s *= 1 - Math.sin(Math.PI * Math.min(1, this.blinkT)) * .96;
        if (this.blinkT >= 1) this.blinkT = -1;
      }
      this.draw(s);
    }
    draw(s = this.open) {
      this.eyes.forEach((e) => {
        e.g.style.transform = `scaleY(${s.toFixed(3)})`;
        e.p.style.transform = `translate(${this.pos.x.toFixed(2)}px, ${this.pos.y.toFixed(2)}px)`;
      });
    }
  }

  let lastT = performance.now();
  function cupLoop(now) {
    const dt = Math.min(64, now - lastT);
    lastT = now;
    CUPS.forEach((c) => { if (c.visible && c.alive) c.update(dt, now); });
    requestAnimationFrame(cupLoop);
  }
  let cups = null;
  function initCups() {
    const hero = new Cup($('[data-cup="hero"]'), { asleep: MOTION });
    const footer = new Cup($('[data-cup="footer"]'), { asleep: MOTION });
    const invite = new Cup($('[data-cup="invite"]'));
    cups = { hero, footer, invite };
    if (!MOTION) {
      if (STATIC) { hero.look($('.hero__cta .btn')); footer.look($('#ftr-email')); invite.look($('#inv-email')); }
      return;
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        const c = CUPS.find((x) => x.svg === en.target);
        if (c) c.visible = en.isIntersecting;
      }));
      CUPS.forEach((c) => io.observe(c.svg));
    }
    addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); }, { passive: true });
    addEventListener('pointerdown', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); }, { passive: true });
    document.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-look]'); if (el) lookEl = el; });
    document.addEventListener('pointerout', (e) => { const el = e.target.closest('[data-look]'); if (el && el === lookEl && !el.contains(e.relatedTarget)) lookEl = null; });
    document.addEventListener('focusin', (e) => { if (e.target.matches('[data-look]')) lookEl = e.target; });
    document.addEventListener('focusout', () => { lookEl = null; });
    CUPS.forEach((c) => c.svg.addEventListener('pointerdown', () => c.blink()));
    requestAnimationFrame(cupLoop);
  }

  // La taza del hero sube desde el borde del panel, se despierta, lee el titular y mira el botón.
  let heroCupDone = false;
  function heroCupIn(delay = 0) {
    if (heroCupDone || !cups) return;
    heroCupDone = true;
    const svg = $('[data-cup="hero"]');
    if (!MOTION) { svg.style.removeProperty('visibility'); return; }
    gsap.fromTo(svg, { yPercent: 70 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', delay, onStart: () => { svg.style.visibility = 'visible'; } });
    gsap.delayedCall(delay + 0.8, () => {
      cups.hero.wake();
      cups.hero.read($$('.hero__title .w'), () => cups.hero.look($('.hero__cta .btn'), 1300));
    });
  }

  /* ---------------- Toast ---------------- */
  const toastEl = $('[data-toast-el]');
  let toastT;
  function toast(text) {
    $('[data-toast-text]', toastEl).textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3800);
  }

  /* ---------------- Render ---------------- */
  const avatarHTML = (a) => `<span class="av"><img src="${a.src}" alt="" loading="lazy" style="width:${a.z * 100}%;left:${(50 - a.fx * a.z * 100).toFixed(1)}%;top:${(50 - a.fy * a.z * a.r * 100).toFixed(1)}%" /></span>`;
  function renderAvatars() {
    $$('[data-avatars]').forEach((el) => { el.innerHTML = AVATARS.map(avatarHTML).join(''); });
  }

  function renderRoles() {
    $('[data-roles]').innerHTML = ROLES.map((r, i) => `<li class="rcard" style="--i:${i}">
        <p class="rcard__who">${r.who}</p>
        <h3 class="rcard__name">${r.name}</h3>
        <p class="rcard__txt">${r.text}</p>
        <ul class="perks">${r.perks.map((x, n) => `<li${n === 0 ? ' class="is-free"' : ''}>${icon('i-check')}${x}</li>`).join('')}</ul>
        <div class="rcard__foot">
          <button class="btn btn--join" type="button" data-join="${r.role}" data-look>${r.cta}${icon('i-arrow')}</button>
        </div>
      </li>`).join('');
  }

  function renderBento() {
    $('[data-bento]').innerHTML = SHARE.map((s) => `<li class="tile${s.cls ? ' ' + s.cls : ''}">
        ${s.img ? `<img class="tile__img" src="${CO(s.img, s.cls === 'tile--tall' ? 1100 : 900)}" alt="${s.alt}" width="900" height="1125" loading="lazy" />` : ''}
        <div class="tile__body">
          <h3 class="tile__title">${s.name}</h3>
          <p>${s.text}</p>
          ${s.link}
        </div>
      </li>`).join('');
  }

  // Los botones del carnet (bento y sección del carnet) cambian según haya sesión.
  const syncCarnetCtas = () => $$('[data-passport-cta]').forEach((b) => { b.textContent = user ? 'Buscar mi próximo sello' : 'Activar mi carnet'; });

  const BOWL = 'M401.26,372.04H855.18V483.1C855.18,608.45 753.57,710.06 628.22,710.06S401.26,608.45 401.26,483.1Z';
  // Sello = taza chica. Vacía: contorno punteado. Sellada: llena y con ojos. Nueva: se sirve, se llena y se despierta.
  function stampSVG(reward, label) {
    return `<svg class="st" viewBox="205 250 670 470" aria-hidden="true" focusable="false">
      <g class="st__o"><circle cx="300.48" cy="445.59" r="75.65"/><path d="${BOWL}"/></g>
      <text class="st__n" x="628" y="${reward ? 560 : 590}">${label}</text>
      <g class="st__f"><circle cx="300.48" cy="445.59" r="75.65"/><path d="${BOWL}"/></g>
      <g class="st__e"><circle class="w" cx="562" cy="492" r="64"/><circle class="w" cx="690" cy="492" r="64"/><circle class="p" cx="549" cy="490" r="33"/><circle class="p" cx="677" cy="490" r="33"/></g>
      <line class="st__s" x1="628" y1="250" x2="628" y2="640"/>
    </svg>`;
  }

  function passportHTML({ name, label, no, stamps, fresh = false }) {
    const n = stamps.length;
    const slots = Array.from({ length: 8 }, (_, i) => {
      const s = stamps[i];
      const reward = i === 3 || i === 7;
      const cls = ['stamp', reward && 'is-reward', s && 'is-on', s && fresh && i === n - 1 && 'is-new'].filter(Boolean).join(' ');
      const cap = s ? esc(s.cafe) : reward ? (i === 3 ? 'Taza de regalo' : 'Cata para dos') : '';
      return `<li class="${cls}">${stampSVG(reward, reward ? (i === 3 ? 'TAZA' : 'CATA') : i + 1)}<small>${cap}</small></li>`;
    }).join('');
    const next = n < 4 ? 4 : 8;
    const left = Math.max(0, next - n);
    const pct = Math.min(100, (n / 8) * 100);
    const prize = next === 4 ? 'tu taza de regalo' : 'tu cata para dos';
    const foot = left
      ? `<strong>${left === 1 ? 'Te falta 1 sello' : `Te faltan ${left} sellos`}</strong> para ${prize}.`
      : '<strong>¡Carnet completo!</strong> Pedí tu cata en cualquier barra del Club.';
    return `<div class="pp__head"><p class="pp__label">${label}</p><p class="pp__no">N.º ${no}</p></div>
      <p class="pp__name">${esc(name)}</p>
      <ol class="stamps" aria-label="${n} de 8 sellos">${slots}</ol>
      <div class="pp__foot"><div class="pp__bar" data-p="${pct}"><i></i></div><p>${foot}</p></div>`;
  }

  const bars = MOTION && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.setProperty('--p', e.target.dataset.p + '%');
      bars.unobserve(e.target);
    }), { threshold: 0.6 })
    : null;
  const fillBars = (scope) => $$('.pp__bar', scope).forEach((b) => (bars ? bars.observe(b) : b.style.setProperty('--p', b.dataset.p + '%')));

  let demo = DEMO_STAMPS.slice();
  function renderPassport(fresh = false) {
    const el = $('[data-passport]');
    el.innerHTML = user
      ? passportHTML({ name: user.name, label: 'Tu carnet', no: '0313', stamps: user.stamps })
      : passportHTML({ name: 'Martina R.', label: 'Carnet · ejemplo', no: '0127', stamps: demo, fresh });
    fillBars(el);
    syncDemoBtn();
  }

  // "Probá cómo se sella": se sirve café en la próxima taza del carnet de ejemplo.
  function syncDemoBtn() {
    $('[data-stamp-demo]').hidden = !!user;
    $('[data-demo-msg]').hidden = !!user;
  }
  function demoCopy(n, cafe) {
    const msg = $('[data-demo-msg]');
    if (!cafe) { msg.textContent = 'Cada visita llena una taza.'; }
    else {
      msg.textContent = n === 4 ? `Sello en ${cafe}: ¡ganaste tu taza de regalo!`
        : n === 8 ? `Sello en ${cafe}: carnet completo, te toca una cata para dos.`
          : `Sello en ${cafe}. ${n < 4 ? `Te ${4 - n === 1 ? 'falta 1 sello' : `faltan ${4 - n} sellos`} para la taza.` : `Te ${8 - n === 1 ? 'falta 1 sello' : `faltan ${8 - n} sellos`} para la cata.`}`;
    }
    $('[data-stamp-demo]').textContent = n >= 8 ? 'Empezar de nuevo' : cafe ? 'Sellar otra visita' : 'Probá cómo se sella';
  }
  function stampDemo() {
    if (user) return;
    const el = $('[data-passport]');
    const prev = $('.pp__bar', el);
    const from = prev ? prev.dataset.p : 0;
    const reset = demo.length >= 8;
    const cafe = reset ? null : DEMO_NEXT[(demo.length - DEMO_STAMPS.length) % DEMO_NEXT.length];
    demo = reset ? DEMO_STAMPS.slice() : [...demo, { cafe }];
    el.innerHTML = passportHTML({ name: 'Martina R.', label: 'Carnet · ejemplo', no: '0127', stamps: demo, fresh: !reset });
    const bar = $('.pp__bar', el);
    bar.style.setProperty('--p', from + '%');
    requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--p', bar.dataset.p + '%')));
    demoCopy(demo.length, cafe);
  }

  function evHTML(ev, i, bump = false) {
    const on = rsvps().includes(ev.id);
    const spots = ev.spots - (on ? 1 : 0);
    return `<li class="ev" data-ev="${ev.id}" style="--i:${i}">
        <div class="ev__media"><img src="${CO(ev.img, 700)}" alt="" width="540" height="675" loading="lazy" />
          <p class="ev__date"><b>${ev.day}</b><span><span>${ev.dow} · ${ev.mon}</span><span>${ev.time}</span></span></p></div>
        <div class="ev__body">
          <p class="ev__place">${ev.place}</p>
          <h3 class="ev__title">${ev.title}</h3>
          <p class="ev__meta">${ev.price}</p>
          <div class="ev__foot">
            <p class="ev__spots${spots <= 5 ? ' is-low' : ''}${bump ? ' is-bump' : ''}">${spots === 1 ? 'Queda 1 lugar' : `Quedan ${spots} lugares`}</p>
            <button class="btn btn--sm ${on ? 'btn--ink' : 'btn--ghost'}" type="button" data-rsvp="${ev.id}" aria-pressed="${on}" aria-label="${on ? `Cancelar mi reserva en ${esc(ev.title)}` : `Reservar mi lugar en ${esc(ev.title)}`}">${on ? `${icon('i-check')}Reservado` : 'Reservar mi lugar'}</button>
          </div>
        </div>
      </li>`;
  }
  function renderEvents() { $('[data-events]').innerHTML = EVENTS.map(evHTML).join(''); }
  function refreshEvent(id) {
    const li = $(`.ev[data-ev="${id}"]`);
    const i = EVENTS.findIndex((e) => e.id === id);
    if (li) li.outerHTML = evHTML(EVENTS[i], i, true);
  }

  function renderBlog() {
    const saved = user ? store.get('saved', []) : [];
    $('[data-blog]').innerHTML = POSTS.map((p, i) => `<li class="post" style="--i:${i}">
        <a class="post__img" href="#" data-toast="Las notas completas llegan en la próxima etapa." tabindex="-1" aria-hidden="true"><img src="${CO(p.img, 700)}" alt="" width="540" height="675" loading="lazy" /></a>
        <button class="save" type="button" data-save="${p.id}" aria-pressed="${saved.includes(p.id)}" aria-label="Guardar nota: ${p.title}">${icon('i-bookmark')}</button>
        <p class="post__cat">${p.cat} · ${p.min} min</p>
        <h3><a href="#" data-toast="Las notas completas llegan en la próxima etapa.">${p.title}</a></h3>
        <p class="post__by">Por ${p.by}</p>
      </li>`).join('');
  }
  const syncSaves = (popId) => {
    const saved = user ? store.get('saved', []) : [];
    $$('[data-save]').forEach((b) => {
      b.setAttribute('aria-pressed', String(saved.includes(b.dataset.save)));
      if (b.dataset.save === popId && MOTION) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); }
    });
  };

  function renderVideos() {
    $('[data-videos]').innerHTML = VIDEOS.map((v, i) => `<button class="vcard" type="button" data-video="${v.id}" style="--i:${i}">
        <span class="vcard__thumb"><img src="${CO(v.thumb, 900)}" alt="" loading="lazy" /><span class="vcard__play">${icon('i-play')}</span><span class="vcard__dur">${v.dur}</span></span>
        <span class="vcard__title">${v.title}</span>
        <span class="vcard__meta">${v.meta}</span>
      </button>`).join('');
  }

  function renderProducts() {
    $('[data-products]').innerHTML = PRODUCTS.map((p) => `<li class="prod">
        <span class="prod__img"><img src="${U(p.img, 560, 700)}" alt="${p.alt}" width="560" height="700" loading="lazy" /></span>
        <h3><a href="../web-eshop/producto.html?id=${p.id}">${p.name}</a></h3>
        <p class="prod__meta">${p.meta}</p>
        <p class="prod__price">${p.compare ? `<s>${money(p.compare)}</s>` : ''}${money(p.price)}</p>
        <p class="prod__member">Miembros ${money(p.price * 0.9)}</p>
      </li>`).join('');
  }

  /* ---------------- Pestañas de historias ---------------- */
  function bindTabs() {
    const list = $('[data-tabs]');
    const tabs = $$('[role="tab"]', list);
    const activate = (t, focus = false) => {
      tabs.forEach((x) => {
        const on = x === t;
        const panel = $('#' + x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        panel.classList.remove('is-in');
        if (on && MOTION) { void panel.offsetWidth; panel.classList.add('is-in'); }
      });
      if (focus) t.focus();
    };
    tabs.forEach((t) => t.addEventListener('click', () => activate(t)));
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d === undefined || i < 0) return;
      e.preventDefault();
      activate(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  }

  /* ---------------- Mapa ---------------- */
  const NOW = (() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Cordoba', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      return { sun: get('weekday') === 'Sun', h: +get('hour') + +get('minute') / 60 };
    } catch (e) {
      const d = new Date();
      return { sun: d.getDay() === 0, h: d.getHours() + d.getMinutes() / 60 };
    }
  })();
  const isOpen = (c) => { const r = NOW.sun ? c.sun : c.wk; return !!r && NOW.h >= r[0] && NOW.h < r[1]; };
  const hh = (h) => (h % 1 ? `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}` : String(h));
  const hoursText = (c) => `Lun a sáb ${hh(c.wk[0])} a ${hh(c.wk[1])} h · ${c.sun ? `dom ${hh(c.sun[0])} a ${hh(c.sun[1])} h` : 'dom cerrado'}`;

  const mapState = { filter: '', selected: null };
  let map = null;

  function popupHTML(c) {
    const o = isOpen(c);
    return `<div class="pop">
      <img src="${CO(c.ph, 560)}" alt="" width="260" height="150" />
      <div class="pop__body">
        <p class="pop__name">${c.name}</p>
        <p class="pop__meta">${c.barrio} · ${c.addr}<br />${hoursText(c)}</p>
        <div class="pop__row"><span class="open${o ? ' is-open' : ''}">${o ? 'Abierto ahora' : 'Cerrado ahora'}</span><span>Suma sello</span></div>
        <div class="pop__row"><a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" rel="noopener">Cómo llegar</a></div>
      </div>
    </div>`;
  }

  // En desktop las tarjetas flotan sobre el borde inferior del mapa: se deja ese margen al encuadrar.
  const mapPad = () => (mq('(max-width: 640px)') ? [28, 28] : [48, 48]);
  const mapPadBR = () => (mq('(max-width: 640px)') ? [28, 28] : [48, 140]);

  function initMap() {
    const el = $('#map');
    CAFES.forEach((c, i) => { c.n = String(i + 1).padStart(2, '0'); });
    if (!window.L) { el.innerHTML = '<p class="mapempty" style="margin:24px">No pudimos cargar el mapa. Revisá tu conexión.</p>'; return; }
    map = L.map(el, { scrollWheelZoom: false, zoomControl: false, zoomSnap: 0.25, fadeAnimation: !STATIC, zoomAnimation: !STATIC, markerZoomAnimation: !STATIC });
    L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, crossOrigin: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    CAFES.forEach((c) => {
      c.marker = L.marker([c.lat, c.lng], {
        title: c.name, riseOnHover: true,
        icon: L.divIcon({ className: 'pin-wrap', html: `<span class="pin">${c.n}</span>`, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18] }),
      }).addTo(map);
      c.marker.bindPopup(() => popupHTML(c), { minWidth: 260, maxWidth: 260, autoPanPaddingTopLeft: [24, 24], autoPanPaddingBottomRight: mapPadBR() });
      c.marker.on('popupopen', () => select(c.id));
      c.marker.on('popupclose', () => { if (mapState.selected === c.id) select(null); });
    });
    map.fitBounds(L.latLngBounds(CAFES.map((c) => [c.lat, c.lng])), { paddingTopLeft: mapPad(), paddingBottomRight: mapPadBR() });
  }

  function visibleCafes() {
    const q = norm($('#map-q').value.trim());
    const f = mapState.filter;
    return CAFES.filter((c) => (!q || norm(`${c.name} ${c.barrio} ${c.addr}`).includes(q)) && (!f || (f === 'open' ? isOpen(c) : c.tags.includes(f))));
  }

  function renderMapList({ fit = false } = {}) {
    const vis = visibleCafes();
    $('[data-map-list]').innerHTML = vis.length
      ? vis.map((c) => {
        const o = isOpen(c);
        return `<li><button class="mcard${mapState.selected === c.id ? ' is-on' : ''}" type="button" data-cafe="${c.id}">
          <img src="${CO(c.ph, 200)}" alt="" width="64" height="64" loading="lazy" />
          <span><span class="mcard__name">${c.name}<span class="open${o ? ' is-open' : ''}">${o ? 'Abierto' : 'Cerrado'}</span></span>
          <span class="mcard__meta">${c.barrio} · ${c.addr}</span>
          <span class="mcard__tags">${c.tags.map((t) => TAG_NAME[t]).join(' · ')}</span></span>
        </button></li>`;
      }).join('')
      : '<li class="mapempty">No encontramos cafeterías con ese filtro. Probá con otro barrio o con “Todas”.</li>';
    $('[data-map-count]').textContent = `${vis.length} ${vis.length === 1 ? 'cafetería' : 'cafeterías'}${mapState.filter === 'open' ? ' abiertas ahora' : ''}`;
    $('[data-map-list]').scrollLeft = 0;
    if (!map) return;
    CAFES.forEach((c) => {
      const on = vis.includes(c);
      if (on && !map.hasLayer(c.marker)) c.marker.addTo(map);
      if (!on && map.hasLayer(c.marker)) { c.marker.closePopup(); map.removeLayer(c.marker); }
    });
    if (fit && vis.length) {
      const b = L.latLngBounds(vis.map((c) => [c.lat, c.lng]));
      if (vis.length === 1) map.flyTo(b.getCenter(), 15, { duration: 0.6 });
      else map.flyToBounds(b, { paddingTopLeft: mapPad(), paddingBottomRight: mapPadBR(), maxZoom: 15, duration: 0.6 });
    }
  }

  function select(id) {
    mapState.selected = id;
    $$('.mcard').forEach((b) => b.classList.toggle('is-on', b.dataset.cafe === id));
    CAFES.forEach((c) => c.marker && c.marker.getElement() && $('.pin', c.marker.getElement()).classList.toggle('is-on', c.id === id));
    const item = id && $(`.mcard[data-cafe="${id}"]`);
    const list = $('[data-map-list]');
    if (item && list.scrollWidth > list.clientWidth) {
      const li = item.parentElement;
      list.scrollTo({ left: li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2, behavior: smooth() });
    }
  }

  function bindMap() {
    $('[data-map-chips]').addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      mapState.filter = b.dataset.f;
      $$('.chip', e.currentTarget).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderMapList({ fit: true });
    });
    let t;
    $('#map-q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => renderMapList({ fit: true }), 220); });
    $('[data-map-list]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cafe]');
      if (!b) return;
      const c = CAFES.find((x) => x.id === b.dataset.cafe);
      select(c.id);
      if (!map) return;
      const r = $('#map').getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) $('#map').scrollIntoView({ behavior: smooth(), block: 'center' });
      map.flyTo([c.lat, c.lng], 15, { duration: REDUCED ? 0 : 0.7 });
      map.once('moveend', () => c.marker.openPopup());
    });
  }

  /* ---------------- Diálogos ---------------- */
  const menu = $('#menu');
  const su = $('#signup');
  const vid = $('#video');
  const burger = $('[data-open-menu]');
  $$('.menu__links a').forEach((a, i) => a.style.setProperty('--i', i));

  function openDlg(d) {
    if (d.open) return;
    d.showModal();
    root.classList.add('is-locked');
    if (d === menu) burger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
  }
  function closeDlg(d, then) {
    if (!d.open) { if (then) then(); return; }
    d.classList.remove('is-open');
    const done = () => {
      d.close();
      if (!$$('dialog[open]').length) root.classList.remove('is-locked');
      if (d === menu) burger.setAttribute('aria-expanded', 'false');
      if (d === vid) { const v = $('[data-video-el]'); v.pause(); v.removeAttribute('src'); v.load(); }
      if (then) then();
    };
    STATIC || REDUCED ? done() : setTimeout(done, d === menu ? 520 : 380);
  }
  const goTo = (hash) => { const t = hash.length > 1 && $(hash); if (t) t.scrollIntoView({ behavior: smooth() }); };

  $$('dialog.dlg').forEach((d) => {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeDlg(d); });
    d.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]');
      if (!c) return;
      const href = c.getAttribute('href');
      if (href && href.startsWith('#')) { e.preventDefault(); closeDlg(d, () => goTo(href)); } else closeDlg(d);
    });
  });
  burger.addEventListener('click', () => openDlg(menu));

  /* ---------------- Registro en 3 pasos ---------------- */
  const SU = { role: 'a', mode: 'join', pending: null };
  const form1 = $('.su-step[data-step="1"]', su);
  const form2 = $('.su-step[data-step="2"]', su);
  const STEP2 = {
    a: { title: 'Contanos quién sos', sub: 'Con esto armamos tu carnet. Te mandamos un link para entrar, sin contraseñas.', submit: 'Crear mi carnet' },
    b: { title: 'Armemos tu perfil de barista', sub: 'Tu nombre, tu email y, si querés, dónde trabajás. El resto lo completás cuando quieras.', submit: 'Crear mi perfil' },
    c: { title: 'Sumemos tu cafetería', sub: 'Te escribimos en 48 h para sumar tu barra al mapa. Es gratis.', submit: 'Sumar mi cafetería' },
    login: { title: 'Entrá con tu email', sub: 'Te mandamos un link para entrar. Sin contraseñas.', submit: 'Mandame el link' },
  };

  function showStep(n, { focus = true } = {}) {
    $$('.su-step', su).forEach((s) => { s.hidden = +s.dataset.step !== n; });
    $$('[data-steps] li', su).forEach((li, i) => {
      li.classList.toggle('is-on', i < n);
      if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (n === 3) $('[data-su-reason]', su).hidden = true;
    const step = $(`.su-step[data-step="${n}"]`, su);
    if (MOTION && su.classList.contains('is-open')) gsap.from(step.children, { opacity: 0, y: 10, duration: 0.5, ease: 'power3.out', stagger: 0.04, clearProps: 'opacity,transform' });
    if (!focus) return;
    requestAnimationFrame(() => {
      if (n === 2) {
        const first = [$('#su-name'), $('#su-email'), $('#su-cafe')].find((i) => !i.closest('[hidden]') && !i.value.trim());
        (first || $('.su-title', step)).focus({ preventScroll: true });
      } else $('.su-title', step).focus({ preventScroll: true });
    });
  }

  function setupStep2() {
    const login = SU.mode === 'login';
    const cfg = STEP2[login ? 'login' : SU.role];
    $('[data-step2-title]').textContent = cfg.title;
    $('[data-step2-sub]').textContent = cfg.sub;
    $('[data-su-submit]').textContent = cfg.submit;
    $$('[data-only]', form2).forEach((el) => { el.hidden = login || el.dataset.only !== SU.role; });
    $('#su-name').closest('.fld').hidden = login;
    $('.check', form2).hidden = login;
    $('.su-legal', form2).hidden = login;
    $('[data-steps]', su).style.visibility = login ? 'hidden' : '';
  }

  function fieldError(input, ok, msg) {
    const fld = input.closest('.fld');
    fld.classList.toggle('is-error', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    const m = $('.fld__msg', fld);
    if (m) m.textContent = ok ? '' : msg;
    return ok;
  }
  function clearErrors() {
    $$('.fld', su).forEach((f) => f.classList.remove('is-error'));
    $$('.fld__msg', su).forEach((m) => { m.textContent = ''; });
    $$('input', su).forEach((i) => i.removeAttribute('aria-invalid'));
  }

  function openSignup({ role = null, mode = 'join', email = '', name = '', reason = '', pending = null, step = null } = {}) {
    if (user && mode !== 'login') {
      toast(`Ya sos parte del Club, ${user.name}.`);
      goTo('#carnet');
      return;
    }
    hideInvite(false);
    SU.mode = mode;
    SU.pending = pending;
    if (role) SU.role = role;
    clearErrors();
    if (email) $('#su-email').value = email;
    if (name) $('#su-name').value = name;
    const r = $('[data-su-reason]');
    r.hidden = !reason;
    r.textContent = reason;
    const radio = $(`input[name="su-role"][value="${SU.role}"]`, su);
    if (radio) radio.checked = true;
    const start = step || (mode === 'login' || role ? 2 : 1);
    if (start === 2) setupStep2();
    showStep(start, { focus: false });
    openDlg(su);
    showStep(start);
  }

  form1.addEventListener('submit', (e) => {
    e.preventDefault();
    SU.role = $('input[name="su-role"]:checked', su).value;
    SU.mode = 'join';
    setupStep2();
    showStep(2);
  });
  $('[data-su-login]').addEventListener('click', () => { SU.mode = 'login'; clearErrors(); setupStep2(); showStep(2); });
  $('[data-back]').addEventListener('click', () => { SU.mode = 'join'; $('[data-steps]', su).style.visibility = ''; showStep(1); });

  form2.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = SU.mode === 'login';
    const nameI = $('#su-name'); const emailI = $('#su-email'); const cafeI = $('#su-cafe');
    const name = nameI.value.trim(); const email = emailI.value.trim(); const cafe = cafeI.value.trim();
    const checks = [
      login || fieldError(nameI, name.length > 1, 'Escribí tu nombre para tu carnet.'),
      fieldError(emailI, isEmail(email), 'Revisá el email: tiene que ser algo como nombre@mail.com.'),
      login || SU.role !== 'c' || fieldError(cafeI, cafe.length > 1, 'Escribí el nombre de tu cafetería.'),
    ];
    if (checks.includes(false)) { const bad = $('.fld.is-error input', form2); if (bad) bad.focus(); return; }
    const btn = $('button[type="submit"]', form2);
    btn.classList.add('is-loading-btn');
    btn.disabled = true;
    setTimeout(() => {
      btn.classList.remove('is-loading-btn');
      btn.disabled = false;
      if (login) {
        const guess = email.split('@')[0].replace(/[._\d-]+/g, ' ').trim().split(' ')[0] || 'vos';
        setUser({ name: guess.charAt(0).toUpperCase() + guess.slice(1), email, role: 'a', stamps: DEMO_STAMPS, news: true });
        closeDlg(su, () => toast(`Te mandamos el link a ${email}. En el prototipo ya entraste.`));
        return;
      }
      setUser({
        name, email, role: SU.role,
        cafe: SU.role === 'c' ? cafe : '',
        where: SU.role === 'c' ? $('#su-where').value.trim() : '',
        work: SU.role === 'b' ? $('#su-work').value.trim() : '',
        news: $('input[name="news"]', form2).checked,
        stamps: [{ cafe: 'Bienvenida' }],
      });
      bumpProof();
      renderDone(applyPending(), true);
      showStep(3);
    }, MOTION ? 900 : 0);
  });

  function renderDone(extra = '', fresh = false) {
    const u = user || { name: 'Martina', email: 'martina@mail.com', role: SU.role, cafe: 'Tu cafetería', stamps: [{ cafe: 'Bienvenida' }] };
    const lines = {
      a: 'Tu primer sello ya está en el carnet.',
      b: 'Tu perfil de barista ya está activo y tenés tu primer sello.',
      c: `Te escribimos en 48 h para sumar ${esc(u.cafe || 'tu cafetería')} al mapa. Mientras, este es tu carnet.`,
    };
    $('[data-done-sub]').innerHTML = `Te mandamos un link a <strong>${esc(u.email)}</strong> para entrar desde cualquier dispositivo. ${lines[u.role] || lines.a}${extra ? ' ' + extra : ''}`;
    const mini = $('[data-passport-mini]');
    mini.innerHTML = passportHTML({ name: u.name, label: 'Tu carnet', no: '0313', stamps: u.stamps, fresh });
    $$('.pp__bar', mini).forEach((b) => b.style.setProperty('--p', b.dataset.p + '%'));
  }

  // Acciones que pidieron cuenta (reservar, guardar) y se completan al registrarse.
  function applyPending() {
    const p = SU.pending;
    SU.pending = null;
    if (!p) return '';
    if (p.type === 'rsvp') {
      const rs = store.get('rsvp', []);
      if (!rs.includes(p.id)) store.set('rsvp', [...rs, p.id]);
      refreshEvent(p.id);
      return `Y ya tenés tu lugar en “${EVENTS.find((e) => e.id === p.id).title}”.`;
    }
    if (p.type === 'save') {
      const s = store.get('saved', []);
      if (!s.includes(p.id)) store.set('saved', [...s, p.id]);
      syncSaves(p.id);
      return 'La nota quedó en tus guardados.';
    }
    return '';
  }

  function bumpProof() {
    $$('.hero .proof [data-count], .invite [data-count]').forEach((el) => {
      const n = +el.dataset.count + 1;
      el.dataset.count = n;
      el.textContent = fmt(n);
    });
  }

  /* ---------------- Formularios de email (footer e invitación) ---------------- */
  function bindJoinForm(form) {
    const nameI = $('input[name="name"]', form);
    const emailI = $('input[type="email"]', form);
    const msg = $('.join__msg', form);
    emailI.addEventListener('input', () => { msg.textContent = ''; emailI.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = emailI.value.trim();
      if (!isEmail(v)) {
        emailI.setAttribute('aria-invalid', 'true');
        msg.textContent = v ? 'Revisá el email: tiene que ser algo como nombre@mail.com.' : 'Escribí tu email para sumarte.';
        emailI.focus();
        return;
      }
      openSignup({ email: v, name: nameI ? nameI.value.trim() : '' });
    });
  }
  $$('[data-join-form], [data-invite-form]').forEach(bindJoinForm);

  /* ---------------- Invitación (pop-up) ---------------- */
  const invite = $('[data-invite]');
  let inviteShown = false;
  function showInvite() {
    if (inviteShown || user || store.get('invite-off', false) || root.classList.contains('is-loading') || params.has('noinvite')) return;
    inviteShown = true;
    invite.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => invite.classList.add('is-on')));
    if (cups) setTimeout(() => cups.invite.look($('#inv-email'), 1400), 700);
  }
  function hideInvite(remember = true) {
    if (remember) store.set('invite-off', true);
    if (invite.hidden) return;
    invite.classList.remove('is-on');
    setTimeout(() => { invite.hidden = true; }, STATIC ? 0 : 500);
  }
  $('[data-invite-close]').addEventListener('click', () => hideInvite(true));
  function scheduleInvite() {
    if (STATIC) return;
    setTimeout(showInvite, 9000);
    addEventListener('scroll', function onS() {
      if (scrollY > document.documentElement.scrollHeight * 0.3) { showInvite(); removeEventListener('scroll', onS); }
    }, { passive: true });
  }

  /* ---------------- Estado logueado ---------------- */
  function renderUser() {
    const on = !!user;
    $('.hdr [data-join="login"]').hidden = on;
    $('.hdr__join').hidden = on;
    const me = $('[data-me]');
    me.hidden = !on;
    if (on) {
      $('[data-me-txt]').textContent = `Hola, ${user.name}`;
      $('[data-me-n]').textContent = user.stamps.length;
      me.setAttribute('aria-label', `Tu carnet: ${user.stamps.length} ${user.stamps.length === 1 ? 'sello' : 'sellos'}`);
      hideInvite(false);
    }
    const ftrForm = $('.ftr__form');
    ftrForm.hidden = on;
    let fw = $('.ftr__welcome');
    if (on) {
      if (!fw) { fw = document.createElement('div'); fw.className = 'ftr__welcome'; ftrForm.after(fw); }
      fw.innerHTML = `<p>Ya sos parte, ${esc(user.name)}. ${user.news ? `La Semanal te llega a ${esc(user.email)}.` : 'Podés sumarte a La Semanal desde tu cuenta.'}</p><a class="btn btn--join" href="#carnet">Ver mi carnet</a>`;
    } else if (fw) fw.remove();
    syncCarnetCtas();
    renderPassport();
    if ($('[data-events]').children.length) renderEvents();
    syncSaves();
  }

  /* ---------------- Clicks globales ---------------- */
  document.addEventListener('click', (e) => {
    const j = e.target.closest('[data-join]');
    if (j) {
      e.preventDefault();
      const v = j.dataset.join;
      const go = () => (v === 'login' ? openSignup({ mode: 'login' }) : openSignup({ role: v || null }));
      if (j.closest('#menu')) closeDlg(menu, go); else go();
      return;
    }
    const t = e.target.closest('[data-toast]');
    if (t) { e.preventDefault(); toast(t.dataset.toast); return; }

    const r = e.target.closest('[data-rsvp]');
    if (r) {
      const ev = EVENTS.find((x) => x.id === r.dataset.rsvp);
      if (!user) { openSignup({ reason: `Sumate gratis para reservar tu lugar en “${ev.title}”.`, pending: { type: 'rsvp', id: ev.id } }); return; }
      const rs = store.get('rsvp', []);
      const on = rs.includes(ev.id);
      store.set('rsvp', on ? rs.filter((x) => x !== ev.id) : [...rs, ev.id]);
      refreshEvent(ev.id);
      const again = $(`[data-rsvp="${ev.id}"]`);
      if (again) again.focus();
      toast(on ? 'Liberaste tu lugar. ¡Otra vez será!' : `Listo: tenés lugar en “${ev.title}”. Te avisamos un día antes.`);
      return;
    }
    const s = e.target.closest('[data-save]');
    if (s) {
      if (!user) { openSignup({ reason: 'Sumate gratis para guardar notas y leerlas cuando quieras.', pending: { type: 'save', id: s.dataset.save } }); return; }
      const saved = store.get('saved', []);
      const on = saved.includes(s.dataset.save);
      store.set('saved', on ? saved.filter((x) => x !== s.dataset.save) : [...saved, s.dataset.save]);
      syncSaves(s.dataset.save);
      toast(on ? 'Quitaste la nota de tus guardados.' : 'Nota guardada en tu cuenta.');
      return;
    }
    const vb = e.target.closest('[data-video]');
    if (vb) { openVideo(vb.dataset.video); return; }
    if (e.target.closest('[data-stamp-demo]')) { stampDemo(); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) { copyText(cp); return; }
    if (e.target.closest('[data-passport-cta]')) {
      if (user) goTo('#mapa');
      else openSignup({ reason: 'Activá tu carnet: el primer sello va de regalo.' });
    }
  });

  // Copiar el hashtag: el botón confirma en el lugar y vuelve solo.
  function copyText(btn) {
    const text = btn.dataset.copy;
    const label = $('[data-copy-label]', btn);
    const ok = () => {
      label.textContent = 'Copiado: pegalo en tu post';
      btn.classList.add('is-done');
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { label.textContent = `Copiar ${text}`; btn.classList.remove('is-done'); }, 2400);
    };
    // Respaldo para navegadores sin API del portapapeles (o sin permiso).
    const legacy = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta); ta.select();
      let done = false;
      try { done = document.execCommand('copy'); } catch (e) { /* nada */ }
      ta.remove();
      if (done) ok(); else toast(`Usá ${text} en tu post.`);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, legacy);
    else legacy();
  }

  function openVideo(id) {
    const v = VIDEOS.find((x) => x.id === id) || VIDEOS[0];
    $('[data-video-title]').textContent = v.title;
    const el = $('[data-video-el]');
    el.poster = CO(v.thumb, 1200);
    el.src = v.src;
    openDlg(vid);
    if (!STATIC) el.play().catch(() => { /* el usuario puede darle play */ });
  }

  /* ---------------- Header ---------------- */
  const hdr = $('#hdr');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-top', y < 24);
    hdr.classList.toggle('is-hidden', y > lastY + 4 && y > innerHeight * 0.8);
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if ('IntersectionObserver' in window) {
    const links = $$('.hdr__nav a');
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => (a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['nosotros', 'comunidad', 'juntadas', 'mapa', 'historias', 'tienda'].forEach((id) => io.observe($('#' + id)));
  }

  /* ---------------- Motion ---------------- */
  function counters() {
    $$('[data-count]').filter((el) => !el.closest('[data-invite]')).forEach((el) => {
      const to = +el.dataset.count;
      if (!MOTION) { el.textContent = fmt(to); return; }
      // Los números van dentro de una oración centrada: se fija el ancho final para que no salte el texto.
      el.textContent = fmt(to);
      if (el.classList.contains('num')) el.style.minWidth = el.getBoundingClientRect().width + 'px';
      const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: to, duration: 1.8, ease: 'power3.out',
        onUpdate: () => { el.textContent = fmt(o.v); },
        onComplete: () => { el.textContent = fmt(+el.dataset.count); },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
  }

  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
    return $$('.w', el);
  }

  // Motion de scroll: pocas cosas y cada una con motivo.
  function scrollMotion() {
    if (!MOTION) return;
    // Las fotos dentro de la frase de "Quiénes somos" se abren cuando la frase entra.
    gsap.fromTo('[data-pic]', { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.about__statement', start: 'top 78%', once: true } });
    gsap.fromTo('[data-pic] img', { scale: 1.35 }, { scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.about__statement', start: 'top 78%', once: true } });

    // Tarjetas en grilla: escalonadas al entrar. Solo las que todavía no se ven.
    const cards = $$('.rcard, .tile, .ev, .post, .prod, .howto__list li, .ig__row li').filter((el) => el.getBoundingClientRect().top > innerHeight);
    if (cards.length) {
      gsap.set(cards, { opacity: 0, y: 28 });
      ScrollTrigger.batch(cards, {
        start: 'top 92%', once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, overwrite: true, clearProps: 'transform' }),
      });
    }

    // Al bajar, la taza del hero se esconde detrás del borde del panel; al volver arriba, asoma de nuevo.
    gsap.to('[data-hero-cup]', { y: () => $('[data-hero-cup]').offsetHeight * 0.9, ease: 'none', scrollTrigger: { trigger: '[data-hero-panel]', start: 'bottom 92%', end: 'bottom 40%', scrub: 0.4, invalidateOnRefresh: true } });
    // La taza del pie duerme hasta que llegás; ahí se despierta y mira el formulario.
    ScrollTrigger.create({ trigger: '.ftr', start: 'top 80%', once: true, onEnter: () => setTimeout(() => { cups.footer.wake(); cups.footer.look($('#ftr-email'), 1500); }, 300) });
    gsap.from('[data-cup="footer"]', { yPercent: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 86%', once: true } });

    // El cierre se abre como el hero: el marco crece a medida que llega.
    const frame = $('[data-closing]');
    const rad = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 24;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.closing', start: 'top 92%', end: 'top 12%', scrub: 0.6 } });
    tl.fromTo(frame, { clipPath: `inset(7% 8% 7% 8% round ${rad + 8}px)` }, { clipPath: `inset(0% 0% 0% 0% round ${rad}px)`, ease: 'none' }, 0)
      .fromTo('.closing__img', { scale: 1.16 }, { scale: 1, ease: 'none' }, 0);

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  // "Cómo funciona": los cuencos se llenan cuando la lista entra.
  function levels() {
    const how = $('.howto');
    if (!MOTION || !('IntersectionObserver' in window)) { how.classList.add('is-in'); return; }
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { how.classList.add('is-in'); io.disconnect(); } }, { threshold: .35 });
    io.observe(how);
  }

  function afterIntro() {
    heroCupIn(0.1);
    levels();
    counters();
    scrollMotion();
    scheduleInvite();
  }

  /* ---------------- Precarga e intro del hero ---------------- */
  // clip-path animado con un objeto intermedio: el navegador normaliza inset() (4 valores pasan
  // a 3 si izquierda y derecha coinciden) y GSAP terminaría mezclando los números con el radio.
  function clipper(el, unit = 'px') {
    const c = { t: 0, r: 0, b: 0, l: 0, rad: 0 };
    const apply = () => { el.style.clipPath = `inset(${c.t}${unit} ${c.r}${unit} ${c.b}${unit} ${c.l}${unit} round ${c.rad}px)`; };
    return { c, apply, set(v) { Object.assign(c, v); apply(); } };
  }

  // Las fotos de la comunidad llegan desde los bordes y se juntan ("el café nos junta"); al final
  // caen dentro de la taza y la capa amarilla de la precarga se achica hasta ser el panel del hero.
  function intro() {
    const loader = $('[data-loader]');
    const title = $('.hero__title');
    const panel = $('[data-hero-panel]');
    const heroIn = $$('[data-hero-in]');

    if (!MOTION) { introOver = true; clearTimeout(emergency); if (loader) loader.remove(); heroCupDone = true; afterIntro(); return; }
    const words = splitWords(title);
    // Nadie ve la precarga en una pestaña oculta: se muestra la página directamente.
    if (document.hidden && root.classList.contains('is-loading')) { endIntroNow(); return; }
    const rad = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 24;

    // Sin precarga (?noload, ?open): el panel se abre y la taza asoma.
    if (!root.classList.contains('is-loading')) {
      introOver = true;
      clearTimeout(emergency);
      if (loader) loader.remove();
      const pc = clipper(panel, '%');
      pc.set({ t: 4, r: 6, b: 4, l: 6, rad: rad + 12 });
      gsap.to(pc.c, { t: 0, r: 0, b: 0, l: 0, rad, duration: 1.4, ease: 'expo.out', onUpdate: pc.apply, onComplete: () => panel.style.removeProperty('clip-path') });
      gsap.from(words, { opacity: 0, yPercent: 40, duration: 1.1, ease: 'expo.out', stagger: 0.07 });
      gsap.from(heroIn, { opacity: 0, y: 16, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.25 });
      heroCupIn(0.7);
      afterIntro();
      return;
    }

    const deck = $('[data-deck]', loader);
    const cards = $$('.loader__card', deck);
    const pctEl = $('[data-loader-pct]', loader);
    const count = $('.loader__count', loader);
    const loaderCup = $('[data-loader-cup]', loader);
    const cupSvg = $('[data-cup="hero"]');
    let seen = false;
    try { seen = sessionStorage.getItem('coffella-com5:seen') === '1'; sessionStorage.setItem('coffella-com5:seen', '1'); } catch (e) { /* nada */ }
    const MIN = seen ? 800 : 1600;
    const MAX = 6500;
    const hash = location.hash && location.hash.length > 1 && !location.hash.includes('figmacapture') ? location.hash : '';
    if (!hash) {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      scrollTo(0, 0);
    }

    gsap.set(heroIn, { opacity: 0, y: 18 });
    gsap.set(hdr, { yPercent: -110, transition: 'none' });
    gsap.set(words, { opacity: 0, yPercent: 40 });
    title.style.visibility = 'visible';

    // Carga real: tipografías y fotos del mazo.
    const tracked = cards.map((c) => $('img', c));
    const total = tracked.length + 1;
    let done = 0;
    const tick = () => { done += 1; };
    tracked.forEach((im) => {
      if (im.complete && im.naturalWidth) tick();
      else { im.addEventListener('load', tick, { once: true }); im.addEventListener('error', tick, { once: true }); }
    });
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => { tick(); start(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) endIntroNow(); });

    // La taza espera escondida debajo del borde del panel.
    gsap.set(cupSvg, { yPercent: 70 });

    // El mazo se arma entre el titular y el lugar donde va a aparecer la taza.
    let cupPt = null;
    function layout() {
      const tr = title.getBoundingClientRect();
      const cr = $('[data-hero-cup]').getBoundingClientRect();
      const cw = Math.round(Math.min(Math.max(innerWidth * 0.15, 150), 236));
      const ch = Math.round(cw * 1.25);
      const cx = innerWidth / 2;
      const top = tr.bottom + 24;
      const bottom = Math.min(innerHeight - 64, Math.max(top + ch, cr.top));
      const cy = Math.max(top + ch / 2, (top + bottom) / 2);
      deck.style.setProperty('--cx', cx + 'px');
      deck.style.setProperty('--cy', cy + 'px');
      deck.style.setProperty('--cw', cw + 'px');
      deck.style.setProperty('--ch', ch + 'px');
      // Boca de la taza (donde caen las fotos): centro del cuenco, a la altura del borde.
      const mouthY = Math.min(innerHeight - 40, cr.top + cr.height * 0.25);
      cupPt = { x: cr.left + cr.width / 2 - cx, y: mouthY - cy };
    }

    // Desde dónde llega cada foto (fracción del viewport) y cómo queda apoyada.
    const FROM = [{ x: -0.62, y: -0.18, r: -26 }, { x: 0.62, y: -0.22, r: 24 }, { x: -0.5, y: 0.6, r: -18 }, { x: 0.52, y: 0.58, r: 20 }];
    const REST = [{ x: -26, y: 10, r: -9 }, { x: 24, y: -8, r: 7 }, { x: -12, y: -14, r: -4 }, { x: 16, y: 12, r: 5 }];
    let lastDeal = 0;
    function deal(i) {
      lastDeal = performance.now();
      const f = FROM[i]; const s = REST[i];
      gsap.fromTo(cards[i], { x: f.x * innerWidth, y: f.y * innerHeight, rotate: f.r, opacity: 1 }, { x: s.x, y: s.y, rotate: s.r, duration: 1.1, ease: 'expo.out' });
    }

    // El bucle corre en el ticker de GSAP; los tiempos mínimo y máximo se miden en tiempo real.
    function start() {
      if (introOver) return;
      layout();
      const t0 = performance.now();
      const steps = cards.length;
      let shown = 0; let dealt = 0; let wordsOn = 0;
      const loop = () => {
        if (introOver) { gsap.ticker.remove(loop); return; }
        const now = performance.now();
        const elapsed = now - t0;
        const goal = elapsed > MAX ? 1 : Math.min(done / total, elapsed / MIN, 1);
        shown += (goal - shown) * 0.14;
        if (goal >= 1 && shown > 0.996) shown = 1;
        pctEl.textContent = Math.round(shown * 100);
        if (loaderCup) loaderCup.style.setProperty('--lvl', shown.toFixed(3));
        while (dealt < steps && shown >= ((dealt + 1) / (steps + 1)) * 0.92) { deal(dealt); dealt += 1; }
        while (wordsOn < words.length && shown >= ((wordsOn + 1) / (words.length + 1)) * 0.95) {
          gsap.to(words[wordsOn], { opacity: 1, yPercent: 0, duration: 1, ease: 'expo.out' });
          wordsOn += 1;
        }
        if (shown >= 1 && now - lastDeal > 380) { gsap.ticker.remove(loop); finish(); }
      };
      gsap.ticker.add(loop);
    }

    function finish() {
      const pr = panel.getBoundingClientRect();
      const lc = clipper(loader);
      const to = { t: Math.max(0, pr.top), r: Math.max(0, innerWidth - pr.right), b: Math.max(0, innerHeight - pr.bottom), l: Math.max(0, pr.left), rad };
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: cleanup });
      tl.to(count, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0)
        // La taza asoma (va por encima de la precarga) y las fotos caen adentro, una detrás de otra.
        .call(() => heroCupIn(0), null, 0)
        .to(cards, { x: cupPt.x, y: cupPt.y, rotate: 0, scale: 0.16, duration: 0.6, ease: 'power3.in', stagger: 0.06 }, 0.35)
        .to(cards, { opacity: 0, duration: 0.15, ease: 'power1.in', stagger: 0.06 }, 0.8)
        // La capa amarilla se achica hasta coincidir con el panel del hero y se va.
        .call(() => lc.set({ t: 0, r: 0, b: 0, l: 0, rad: 0 }), null, 0.9)
        .to(lc.c, { ...to, duration: 0.85, ease: 'expo.inOut', onUpdate: lc.apply }, 0.9)
        .to(loader, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 1.5)
        .to(heroIn, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 1.45)
        .to(hdr, { yPercent: 0, duration: 0.9 }, 1.45);
    }

    function cleanup() {
      if (introOver) return;
      introOver = true;
      clearTimeout(emergency);
      loader.remove();
      root.classList.remove('is-loading');
      gsap.set([hdr, ...heroIn, ...words], { clearProps: 'all' });
      title.style.removeProperty('visibility');
      if (hash) { const t = $(hash); if (t) t.scrollIntoView(); }
      afterIntro();
    }
  }

  // El mapa (Leaflet y sus teselas) se arma recién cuando la sección se acerca.
  function lazyMap() {
    const start = () => { initMap(); renderMapList(); };
    if (STATIC || !('IntersectionObserver' in window)) { start(); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      start();
    }, { rootMargin: '900px 0px' });
    io.observe($('#map'));
  }

  /* ---------------- Init ---------------- */
  afterIntroHook = afterIntro;
  renderAvatars();
  renderRoles();
  renderBento();
  renderEvents();
  renderBlog();
  renderVideos();
  renderProducts();
  renderMapList();
  lazyMap();
  bindMap();
  bindTabs();
  renderUser();
  initCups();
  onScroll();
  // En capturas no hay scroll real: las imágenes diferidas se cargan de entrada.
  // Carnet de ejemplo con N sellos (capturas): ?carnet=3|4|8 o ?carnet=pour (sirviendo la 4ª visita).
  const CARNET = params.get('carnet');
  if (CARNET && !user) {
    const n = CARNET === 'pour' ? 4 : Math.min(8, Math.max(0, +CARNET || 3));
    demo = [...DEMO_STAMPS, ...DEMO_NEXT.map((cafe) => ({ cafe }))].slice(0, n);
    renderPassport(CARNET === 'pour');
    if (n > 3) demoCopy(n, demo[n - 1].cafe);
  }
  if (params.get('only') === 'carnet') root.classList.add('is-only-carnet');
  if (STATIC) $$('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  // Las capturas a Figma no leen AVIF: en modo estático se usa la versión WebP.
  if (STATIC) $$('source[type="image/avif"]').forEach((el) => el.remove());
  intro();

  // Estados abiertos para revisión y capturas.
  const open = params.get('open');
  const role = ['a', 'b', 'c'].includes(params.get('role')) ? params.get('role') : null;
  if (open === 'menu') openDlg(menu);
  if (open === 'signup') openSignup({ role: null });
  if (open === 'signup-2') openSignup({ role: role || 'a' });
  if (open === 'signup-3') {
    SU.role = role || 'a';
    if (!user) user = { name: 'Martina', email: 'martina@mail.com', role: SU.role, cafe: 'Tertulia', stamps: [{ cafe: 'Bienvenida' }] };
    renderDone('', true);
    showStep(3, { focus: false });
    openDlg(su);
  }
  if (open === 'login') { user = null; openSignup({ mode: 'login' }); }
  if (open === 'signup-2' && params.has('errors')) $('.su-step[data-step="2"] button[type="submit"]').click();
  if (open === 'video') openVideo(VIDEOS[0].id);
  if (open === 'invite') { store.set('invite-off', false); inviteShown = false; params.delete('noinvite'); showInvite(); }
  if (STATIC) staticFixes();

  /* ---------------- Capturas a Figma (?static) ----------------
     html-to-design no lee transforms ni clip-path en SVG ni radios elípticos.
     Acá se pasan a atributos y a medidas explícitas. */
  function staticFixes() {
    $$('.stamp').forEach((st) => {
      const drop = (sel) => $$(sel, st).forEach((n) => n.remove());
      if (st.classList.contains('is-new') && CARNET === 'pour') {
        const id = 'pour-' + Math.random().toString(36).slice(2, 7);
        $('.st', st).insertAdjacentHTML('afterbegin', `<defs><clipPath id="${id}"><rect x="200" y="585" width="700" height="140"/></clipPath></defs>`);
        $('.st__f', st).setAttribute('clip-path', `url(#${id})`);
        $('.st__f', st).style.clipPath = `url(#${id})`;
        $('.st__o', st).style.opacity = '1';
        $('.st__s', st).style.transform = 'none';
        drop('.st__e, .st__n');
      } else if (st.classList.contains('is-on')) drop('.st__o, .st__n, .st__s');
      else drop('.st__f, .st__e, .st__s');
      st.classList.remove('is-new');
    });
    $$('.cup, .st').forEach((svg) => {
      $$('*', svg).forEach((el) => {
        if (['defs', 'clipPath', 'rect'].includes(el.tagName) || el.closest('defs')) return;
        const cs = getComputedStyle(el);
        const m = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : null;
        if ((m && Math.abs(m.d) < 0.05) || +cs.opacity < 0.02 || cs.display === 'none') { el.remove(); return; }
        if (m && el.tagName === 'circle') {
          el.setAttribute('cx', +el.getAttribute('cx') + m.e);
          el.setAttribute('cy', +el.getAttribute('cy') + m.f);
        }
        el.style.transform = 'none';
        ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-dasharray', 'opacity'].forEach((k) => {
          const v = cs.getPropertyValue(k);
          if (k === 'fill' && v === 'none') el.setAttribute('fill', 'none');
          else if (v && v !== 'none' && !(k === 'opacity' && v === '1')) el.setAttribute(k, v);
        });
        if (el.tagName === 'text') { el.setAttribute('font-family', 'Sora'); el.setAttribute('font-weight', '600'); el.setAttribute('font-size', cs.fontSize); el.setAttribute('text-anchor', 'middle'); }
      });
    });
    $$('.lvl').forEach((el) => { const w = el.getBoundingClientRect().width; el.style.borderRadius = `0 0 ${w / 2}px ${w / 2}px`; });
    // Texto con elementos en línea (fotos, píldoras, links) que corta de línea: html-to-design
    // ubica mal los tramos que cruzan un salto, así que cada párrafo se rearma en líneas fijas.
    // Se mide con las fuentes ya cargadas: con la de reemplazo los cortes caen en otro lugar.
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => $$('main p, main h1, main h2, main h3, .ftr p, dialog p').forEach((p) => {
      const cs = getComputedStyle(p);
      // Figma tampoco aplica text-wrap: balance, así que esos textos también se fijan para no dejar viudas.
      const balanced = /balance/.test(cs.textWrapStyle || cs.textWrap || '');
      if ((!p.children.length && !balanced) || p.closest('[hidden]') || p.getClientRects().length === 0) return;
      if (/flex|grid/.test(cs.display)) return;
      const lh = parseFloat(cs.lineHeight) || 20;
      if (p.getBoundingClientRect().height < lh * 1.6) return;
      // Títulos que son un único link (notas, productos): se fijan las líneas dentro del link.
      const a = p.children.length === 1 && p.firstElementChild.tagName === 'A' && p.firstElementChild.textContent.trim() === p.textContent.trim() ? p.firstElementChild : null;
      if (a && a.getClientRects().length > 1) { freezeLines(a, lh); a.style.display = 'block'; return; }
      freezeLines(p, lh);
    }));
  }
  function freezeLines(p, lh) {
    const tokens = [];
    [...p.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((t) => { if (t) tokens.push(t); });
      else if (n.nodeType === 1) tokens.push(n);
    });
    p.textContent = '';
    const els = tokens.map((t) => {
      if (typeof t !== 'string') { p.appendChild(t); return t; }
      const s = document.createElement('span');
      s.textContent = t;
      p.appendChild(s);
      return s;
    });
    // Agrupa por renglón según la posición real de cada palabra o elemento.
    const lines = [];
    let cur = null;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      const blank = !el.children.length && /^\s+$/.test(el.textContent);
      if (blank || !r.height) { if (cur) cur.items.push(el); return; }
      // Sora tiene ascendentes y descendentes altos: los renglones se solapan un poco, así que se compara contra el alto de línea.
      if (!cur || r.top > cur.top + lh * 0.5) { cur = { top: r.top, items: [] }; lines.push(cur); }
      cur.items.push(el);
      // Un link que ya corta en varias líneas (títulos de historias) tiene que poder seguir cortando.
      if (el.getClientRects().length > 1) cur.multi = true;
    });
    p.textContent = '';
    lines.forEach((line) => {
      const row = document.createElement('span');
      row.style.display = 'block';
      // Sin esto, Figma mide Sora apenas más ancha y vuelve a cortar los renglones justos.
      if (!line.multi) row.style.whiteSpace = 'nowrap';
      let text = '';
      const flush = () => { if (text) { row.appendChild(document.createTextNode(text)); text = ''; } };
      line.items.forEach((el) => {
        if (el.tagName === 'SPAN' && !el.className && !el.children.length) text += el.textContent;
        else { flush(); row.appendChild(el); }
      });
      flush();
      if (row.lastChild && row.lastChild.nodeType === 3) row.lastChild.textContent = row.lastChild.textContent.replace(/\s+$/, '');
      if (row.firstChild && row.firstChild.nodeType === 3) row.firstChild.textContent = row.firstChild.textContent.replace(/^\s+/, '');
      p.appendChild(row);
    });
  }
})();
