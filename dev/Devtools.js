/* ══════════════════════════════════════════
   dev/Devtools.js — ConecTEA
   Modal de DevTools auto-injetável.
   Basta incluir este script em qualquer página
   (após state.js) e o botão 🛠️ aparece.

   Uso:
     <link rel="stylesheet" href="devtools.css"/>
     <script src="state.js"></script>
     <script src="devtools.js"></script>
══════════════════════════════════════════ */

(function () {
  'use strict';

  /* Evita dupla injeção */
  if (document.getElementById('fc-devtools-modal')) return;

  /* Não injeta dentro de iframes (modo tela dupla) */
  if (window.self !== window.top) return;

  /* ══════════════════════════════════════
     HTML DO MODAL
  ══════════════════════════════════════ */
  const HTML = `
    <div id="fc-devtools-overlay">
      <div id="fc-devtools-modal">

        <div class="fcd-handle-bar"></div>

        <div class="fcd-topbar">
          <div class="fcd-tb-left">
            <span class="fcd-tb-logo">🛠️</span>
            <span class="fcd-tb-title">DevTools</span>
            <span class="fcd-tb-badge">⚡ Simulação</span>
          </div>
          <button class="fcd-close" id="fcd-close-btn">✕ Fechar</button>
        </div>

        <!-- ÁREA COM SCROLL — flex:1 + min-height:0 -->
        <div class="fcd-body">

          <!-- STATS -->
          <div class="fcd-stats">
            <div class="fcd-stat"><p class="fcd-stat-v" id="fcd-st-total">0</p><p class="fcd-stat-l">Eventos</p></div>
            <div class="fcd-stat"><p class="fcd-stat-v" id="fcd-st-dias">0</p><p class="fcd-stat-l">Dias</p></div>
            <div class="fcd-stat"><p class="fcd-stat-v" id="fcd-st-sos">0</p><p class="fcd-stat-l">SOS</p></div>
          </div>

          <!-- CONTROLE DE TEMPO -->
          <div class="fcd-card">
            <div class="fcd-card-hd">🕐 Controle de Tempo</div>
            <div class="fcd-card-bd">

              <div class="fcd-clock">
                <div class="fcd-clock-big" id="fcd-clock-big">00:00</div>
                <div class="fcd-clock-date" id="fcd-clock-date">—</div>
                <div class="fcd-clock-offset zero" id="fcd-clock-offset">Tempo real</div>
              </div>

              <div class="fcd-slider-row">
                <div class="fcd-slider-lbl">
                  Ajustar hora <span id="fcd-hour-val">—</span>
                </div>
                <input type="range" id="fcd-hour-slider" min="0" max="23" step="1" value="12"/>
              </div>

              <div class="fcd-slider-row">
                <div class="fcd-slider-lbl">
                  Ajustar minuto <span id="fcd-min-val">—</span>
                </div>
                <input type="range" id="fcd-min-slider" min="0" max="59" step="1" value="0"/>
              </div>

              <div class="fcd-time-grid">
                <button class="fcd-ctrl" id="fcd-minus1h">
                  <span class="fcd-ctrl-ico">⏪</span>
                  <span class="fcd-ctrl-lbl">−1 hora</span>
                </button>
                <button class="fcd-ctrl" id="fcd-plus1h">
                  <span class="fcd-ctrl-ico">⏩</span>
                  <span class="fcd-ctrl-lbl">+1 hora</span>
                </button>
                <button class="fcd-ctrl" id="fcd-prevday">
                  <span class="fcd-ctrl-ico">◀</span>
                  <span class="fcd-ctrl-lbl">Dia anterior</span>
                  <span class="fcd-ctrl-sub">−24 horas</span>
                </button>
                <button class="fcd-ctrl" id="fcd-nextday">
                  <span class="fcd-ctrl-ico">▶</span>
                  <span class="fcd-ctrl-lbl">Próximo dia</span>
                  <span class="fcd-ctrl-sub">+24 horas</span>
                </button>
                <button class="fcd-ctrl full" id="fcd-resettime">
                  <span class="fcd-ctrl-ico">🔄</span>
                  <span class="fcd-ctrl-lbl">Resetar para 01/01/2026 12:00</span>
                </button>
              </div>

            </div>
          </div>

          <!-- GERAR DADOS -->
          <div class="fcd-card">
            <div class="fcd-card-hd">🎲 Gerar Dados de Teste</div>
            <div class="fcd-card-bd">
              <div class="fcd-gen-grid">
                <button class="fcd-gen" id="fcd-gen-hoje">
                  <span class="fcd-gen-ico">📅</span>
                  <div><span class="fcd-gen-lbl">Dia típico</span><span class="fcd-gen-sub">8 eventos variados</span></div>
                </button>
                <button class="fcd-gen" id="fcd-gen-ruim">
                  <span class="fcd-gen-ico">😟</span>
                  <div><span class="fcd-gen-lbl">Dia difícil</span><span class="fcd-gen-sub">SOS + mal-estar</span></div>
                </button>
                <button class="fcd-gen" id="fcd-gen-otimo">
                  <span class="fcd-gen-ico">😄</span>
                  <div><span class="fcd-gen-lbl">Dia ótimo</span><span class="fcd-gen-sub">Humor positivo</span></div>
                </button>
                <button class="fcd-gen" id="fcd-gen-agitado">
                  <span class="fcd-gen-ico">⚡</span>
                  <div><span class="fcd-gen-lbl">Dia agitado</span><span class="fcd-gen-sub">Muitas necessidades</span></div>
                </button>
                <button class="fcd-gen full" id="fcd-gen-week">
                  <span class="fcd-gen-ico">📆</span>
                  <div><span class="fcd-gen-lbl">Gerar semana completa</span><span class="fcd-gen-sub">Preenche os últimos 7 dias para o relatório</span></div>
                </button>
              </div>
            </div>
          </div>

          <!-- GERENCIAR DADOS -->
          <div class="fcd-card">
            <div class="fcd-card-hd">🗄️ Gerenciar Dados</div>
            <div class="fcd-card-bd">
              <div class="fcd-gen-grid">
                <button class="fcd-gen" id="fcd-export">
                  <span class="fcd-gen-ico">📤</span>
                  <div><span class="fcd-gen-lbl">Exportar JSON</span><span class="fcd-gen-sub">Baixar backup</span></div>
                </button>
                <button class="fcd-gen" id="fcd-import-btn">
                  <span class="fcd-gen-ico">📥</span>
                  <div><span class="fcd-gen-lbl">Importar JSON</span><span class="fcd-gen-sub">Restaurar backup</span></div>
                </button>
                <input type="file" id="fcd-import-file" accept=".json" style="display:none"/>
                <button class="fcd-gen full" id="fcd-clear" style="border-color:rgba(255,90,90,.25);">
                  <span class="fcd-gen-ico">🗑️</span>
                  <div><span class="fcd-gen-lbl" style="color:#ff5a5a">Limpar tudo</span><span class="fcd-gen-sub">Remove todos os eventos</span></div>
                </button>
              </div>
            </div>
          </div>

          <!-- LOG -->
          <div class="fcd-card">
            <div class="fcd-card-hd">
              📋 Log de ações
              <button id="fcd-clear-log" style="margin-left:auto;font-size:10px;font-weight:900;color:#7aaa8e;cursor:pointer;background:none;border:none;font-family:Nunito,sans-serif;">limpar</button>
            </div>
            <div class="fcd-card-bd" style="padding:10px;">
              <div class="fcd-log" id="fcd-log-box">
                <div class="fcd-log-line info">[DevTools] Pronto.</div>
              </div>
            </div>
          </div>

        </div><!-- /fcd-body -->
      </div><!-- /fc-devtools-modal -->
    </div><!-- /fc-devtools-overlay -->

    <button id="fc-devtools-trigger" title="DevTools (🛠️)">🛠️</button>
    <div id="fc-devtools-toast"></div>
  `;

  /* ══════════════════════════════════════
     INJETAR NO DOM
     Cada nó vai direto no <body> — sem wrapper
     — para ficar fora do .phone{overflow:hidden}
     que cortaria o position:fixed do overlay.
  ══════════════════════════════════════ */

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = HTML;
  while (tempDiv.firstChild) {
    document.body.appendChild(tempDiv.firstChild);
  }

  /* ══════════════════════════════════════
     REFERÊNCIAS
  ══════════════════════════════════════ */

  const overlay    = document.getElementById('fc-devtools-overlay');
  const modal      = document.getElementById('fc-devtools-modal');
  const trigger    = document.getElementById('fc-devtools-trigger');
  const closeBtn   = document.getElementById('fcd-close-btn');
  const toastEl    = document.getElementById('fc-devtools-toast');
  const logBox     = document.getElementById('fcd-log-box');
  const hourSlider = document.getElementById('fcd-hour-slider');
  const body       = document.getElementById('fc-devtools-modal').querySelector('.fcd-body');

  /* ══════════════════════════════════════
     ABRIR / FECHAR
  ══════════════════════════════════════ */

  function openModal() {
    overlay.classList.add('open');
    updateClock();
    updateStats();
  }

  function closeModal() {
    overlay.classList.remove('open');
  }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  /* Clica no backdrop (fora do modal) para fechar */


  /* Escape fecha */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  /* Impede que scroll dentro do modal vaze para a página */
  modal.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  /* ══════════════════════════════════════
     TOAST
  ══════════════════════════════════════ */

  let toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ══════════════════════════════════════
     LOG
  ══════════════════════════════════════ */

  function log(msg, type = 'info') {
    const line = document.createElement('div');
    const d    = new Date();
    const ts   = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    line.className   = `fcd-log-line ${type}`;
    line.textContent = `[${ts}] ${msg}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  document.getElementById('fcd-clear-log').addEventListener('click', () => {
    logBox.innerHTML = '';
    log('Log limpo.', 'info');
  });

  /* ══════════════════════════════════════
     CONTROLE DE TEMPO — HORA FIXA
     Não depende do relógio do notebook.
     Guarda {year,month,day,hour,minute}
     no localStorage — congelado até o
     usuário mudar manualmente.
  ══════════════════════════════════════ */

  const TIME_KEY  = 'fc_time_offset';  // compatibilidade com state.js
  const FIXED_KEY = 'fc_fixed_time';   // hora fixa

  const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  /* ── lê a hora fixa salva ── */
  function getFixed() {
    try {
      const v = JSON.parse(localStorage.getItem(FIXED_KEY));
      if (v && v.year) return v;
    } catch {}
    return null;
  }

  /* ── salva hora fixa e sincroniza fc_time_offset para state.js ── */
  function saveFixed(d) {
    const v = {
      year: d.getFullYear(), month: d.getMonth(),
      day:  d.getDate(),     hour:  d.getHours(), minute: d.getMinutes(),
    };
    localStorage.setItem(FIXED_KEY, JSON.stringify(v));
    // mantém offset sincronizado para state.js ler
    const off = new Date(v.year, v.month, v.day, v.hour, v.minute, 0, 0).getTime() - Date.now();
    localStorage.setItem(TIME_KEY, String(off));
    trigger.classList.add('offset-active');
  }

  /* ── data simulada atual ── */
  function getSimulatedDate() {
    const f = getFixed();
    if (f) return new Date(f.year, f.month, f.day, f.hour, f.minute, 0, 0);
    return new Date();
  }

  function getOffset() {
    return parseInt(localStorage.getItem(TIME_KEY) || '0', 10);
  }

  /* ── só muda hora/min, mantém o dia ── */
  function setFixedHour(h, m) {
    const cur  = getSimulatedDate();
    saveFixed(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), h, m, 0, 0));
    updateClock(); updateStats(); _notifyRerender();
  }

  /* ── avança/retrocede dias, mantém hora/min ── */
  function shiftDays(days) {
    const next = new Date(getSimulatedDate());
    next.setDate(next.getDate() + days);
    saveFixed(next);
    updateClock(); updateStats(); _notifyRerender();
    log(`📅 ${days > 0 ? '+' : ''}${days} dia → ${next.getDate()}/${next.getMonth()+1}/${next.getFullYear()}`, 'ok');
    showToast(`Data: ${days > 0 ? 'próximo dia' : 'dia anterior'}`);
  }

  /* ── avança/retrocede horas ── */
  function shiftHours(h) {
    const next = new Date(getSimulatedDate());
    next.setHours(next.getHours() + h);
    saveFixed(next);
    updateClock(); updateStats(); _notifyRerender();
    log(`⏩ ${h > 0 ? '+' : ''}${h}h`, 'ok');
    showToast(`Hora: ${h > 0 ? '+' : ''}${h}h`);
  }

  /* ── reseta para 01/01/2026 12:00 ── */
  function resetTime() {
    saveFixed(new Date(2026, 0, 1, 12, 0, 0, 0));
    updateClock(); updateStats(); _notifyRerender();
    log('🔄 Resetado para 01/01/2026 12:00', 'info');
    showToast('Resetado: 01/01/2026 12:00');
  }

  /* ── atualiza o relógio na UI ── */
  function updateClock() {
    const d  = getSimulatedDate();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');

    document.getElementById('fcd-clock-big').textContent  = `${hh}:${mm}`;
    document.getElementById('fcd-clock-date').textContent =
      `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} — ${DIAS[d.getDay()]}`;

    hourSlider.value = d.getHours();
    document.getElementById('fcd-hour-val').textContent = `${hh}:${mm}`;

    const minSlider = document.getElementById('fcd-min-slider');
    if (minSlider) {
      minSlider.value = d.getMinutes();
      document.getElementById('fcd-min-val').textContent = mm + ' min';
    }

    const offEl = document.getElementById('fcd-clock-offset');
    offEl.textContent = `⏸ Fixo: ${hh}:${mm}`;
    offEl.className   = 'fcd-clock-offset';
  }

  // hora fixa — sem setInterval

  /* ── slider de HORA ── */
  hourSlider.addEventListener('input', () => {
    const h = parseInt(hourSlider.value, 10);
    setFixedHour(h, getSimulatedDate().getMinutes());
  });

  /* ── slider de MINUTO ── */
  const minSliderEl = document.getElementById('fcd-min-slider');
  if (minSliderEl) {
    minSliderEl.addEventListener('input', () => {
      const min = parseInt(minSliderEl.value, 10);
      setFixedHour(getSimulatedDate().getHours(), min);
    });
  }

  document.getElementById('fcd-minus1h').addEventListener('click',   () => shiftHours(-1));
  document.getElementById('fcd-plus1h').addEventListener('click',    () => shiftHours(1));
  document.getElementById('fcd-prevday').addEventListener('click',   () => shiftDays(-1));
  document.getElementById('fcd-nextday').addEventListener('click',   () => shiftDays(1));
  document.getElementById('fcd-resettime').addEventListener('click', resetTime);

  /* ══════════════════════════════════════
     STATS
  ══════════════════════════════════════ */

  function updateStats() {
    const events = JSON.parse(localStorage.getItem('fc_events') || '[]');
    const dias   = new Set(events.map(e => e.date)).size;
    const sos    = events.filter(e => e.type === 'sos').length;
    document.getElementById('fcd-st-total').textContent = events.length;
    document.getElementById('fcd-st-dias').textContent  = dias;
    document.getElementById('fcd-st-sos').textContent   = sos;
  }

  /* ══════════════════════════════════════
     GERADOR DE DADOS
  ══════════════════════════════════════ */

  const SCENARIOS = {
    hoje: {
      events: [
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:8,  m:5  },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:9,  m:30 },
        { type:'humor', mood:'normal',    icon:'😐', msg:'😐 Estou normal.',                h:10, m:15 },
        { type:'need',  need:'banheiro',  icon:'🚻', msg:'🚻 Preciso do banheiro!',         h:11, m:0  },
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:12, m:30 },
        { type:'need',  need:'abraco',    icon:'🤗', msg:'🤗 Quero um abraço!',            h:13, m:45 },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:14, m:10 },
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:15, m:20 },
      ],
      checkout: { rating: 8, comment: 'Dia tranquilo, participou bem das atividades.' }
    },
    ruim: {
      events: [
        { type:'humor', mood:'mal',       icon:'😢', msg:'😢 Estou mal.',                   h:8,  m:10 },
        { type:'sos',                     icon:'🚨', msg:'SOS — pedido de ajuda urgente',   h:8,  m:12 },
        { type:'need',  need:'silencio',  icon:'🔇', msg:'🔇 Preciso de silêncio.',         h:9,  m:0  },
        { type:'humor', mood:'mal',       icon:'😢', msg:'😢 Estou mal.',                   h:10, m:30 },
        { type:'sos',                     icon:'🚨', msg:'SOS — pedido de ajuda urgente',   h:11, m:5  },
        { type:'need',  need:'ir-embora', icon:'🚪', msg:'🚪 Quero ir embora.',             h:12, m:0  },
        { type:'humor', mood:'normal',    icon:'😐', msg:'😐 Estou normal.',                h:14, m:0  },
        { type:'need',  need:'descanso',  icon:'😴', msg:'😴 Quero descansar.',             h:15, m:30 },
      ],
      checkout: { rating: 3, comment: 'Dia muito difícil. Muita agitação e estímulo excessivo no recreio.' }
    },
    otimo: {
      events: [
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:8,  m:0  },
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:10, m:0  },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:11, m:30 },
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:13, m:0  },
        { type:'need',  need:'abraco',    icon:'🤗', msg:'🤗 Quero um abraço!',            h:14, m:30 },
        { type:'humor', mood:'bem',       icon:'😄', msg:'😄 Estou bem!',                  h:15, m:45 },
      ],
      checkout: { rating: 10, comment: 'Melhor dia do mês! Muito engajada em todas as atividades.' }
    },
    agitado: {
      events: [
        { type:'humor', mood:'normal',    icon:'😐', msg:'😐 Estou normal.',                h:8,  m:0  },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:8,  m:40 },
        { type:'need',  need:'banheiro',  icon:'🚻', msg:'🚻 Preciso do banheiro!',         h:9,  m:15 },
        { type:'humor', mood:'mal',       icon:'😢', msg:'😢 Estou mal.',                   h:10, m:0  },
        { type:'need',  need:'silencio',  icon:'🔇', msg:'🔇 Preciso de silêncio.',         h:10, m:5  },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:11, m:0  },
        { type:'sos',                     icon:'🚨', msg:'SOS — pedido de ajuda urgente',   h:11, m:30 },
        { type:'need',  need:'descanso',  icon:'😴', msg:'😴 Quero descansar.',             h:12, m:0  },
        { type:'humor', mood:'normal',    icon:'😐', msg:'😐 Estou normal.',                h:13, m:30 },
        { type:'need',  need:'abraco',    icon:'🤗', msg:'🤗 Quero um abraço!',            h:14, m:0  },
        { type:'need',  need:'agua',      icon:'💧', msg:'💧 Preciso de água!',             h:15, m:0  },
      ],
      checkout: { rating: 5, comment: 'Dia agitado. Muitas demandas físicas e dificuldade de regular.' }
    }
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function dateStr(d) {
    // Usa data LOCAL para evitar bug de UTC-3 virar dia anterior
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2,'0');
    const dy = String(d.getDate()).padStart(2,'0');
    return `${y}-${mo}-${dy}`;
  }
  function timeStr(h, m) {
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  }

  function injectScenario(scenario, targetDate) {
    const existing = JSON.parse(localStorage.getItem('fc_events') || '[]');
    const ds       = dateStr(targetDate);
    const filtered = existing.filter(e => e.date !== ds);

    const newEvents = scenario.events.map(ev => ({
      id:       uid(),
      type:     ev.type,
      mood:     ev.mood  || undefined,
      need:     ev.need  || undefined,
      icon:     ev.icon,
      message:  ev.msg,
      time:     timeStr(ev.h, ev.m),
      date:     ds,
      status:   'pending',
      note:     '',
      priority: ev.type === 'sos' ? 'high' : undefined,
    }));

    const merged = [...newEvents, ...filtered];
    merged.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });
    localStorage.setItem('fc_events', JSON.stringify(merged));

    if (scenario.events.some(e => e.type === 'humor')) {
      const history   = JSON.parse(localStorage.getItem('fc_humor_history') || '[]');
      const filteredH = history.filter(h => h.date !== ds);
      const scores    = { bem: 85, normal: 50, mal: 20 };
      const humorEvs  = scenario.events
        .filter(e => e.type === 'humor')
        .map(e => ({ date: ds, time: timeStr(e.h, e.m), mood: e.mood, score: scores[e.mood] || 50, icon: e.icon }));
      localStorage.setItem('fc_humor_history', JSON.stringify([...humorEvs, ...filteredH]));
    }

    if (scenario.checkout) {
      const checkouts = JSON.parse(localStorage.getItem('fc_checkouts') || '[]');
      const filteredC = checkouts.filter(c => c.date !== ds);
      filteredC.unshift({ id: uid(), date: ds, time: '17:00', rating: scenario.checkout.rating, comment: scenario.checkout.comment });
      localStorage.setItem('fc_checkouts', JSON.stringify(filteredC));
    }

    return newEvents.length;
  }

  /* Dispara fc_new_event para notificar todas as abas/iframes */
  function _notifyRerender() {
    try {
      const payload = JSON.stringify({ detail: {}, ts: Date.now() });
      localStorage.setItem('fc_evt_fc_new_event', payload);
      setTimeout(() => localStorage.removeItem('fc_evt_fc_new_event'), 200);
      window.dispatchEvent(new CustomEvent('fc_new_event', { detail: {} }));
    } catch {}
  }

  function genDay(type) {
    const count = injectScenario(SCENARIOS[type], getSimulatedDate());
    updateStats();
    _notifyRerender();
    log(`🎲 Cenário "${type}": ${count} eventos em ${dateStr(getSimulatedDate())}`, 'ok');
    showToast(`✅ ${count} eventos gerados!`);
  }

  const WEEK_TYPES = ['otimo','hoje','agitado','ruim','hoje','otimo','agitado'];

  function genWeek() {
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d    = new Date(getSimulatedDate());
      d.setDate(d.getDate() - i);
      const type = WEEK_TYPES[6 - i];
      total += injectScenario(SCENARIOS[type], d);
      log(`📅 ${dateStr(d)}: "${type}"`, 'info');
    }
    updateStats();
    _notifyRerender();
    log(`✅ Semana completa: ${total} eventos`, 'ok');
    showToast(`📆 Semana gerada! ${total} eventos`);
  }

  document.getElementById('fcd-gen-hoje').addEventListener('click',    () => genDay('hoje'));
  document.getElementById('fcd-gen-ruim').addEventListener('click',    () => genDay('ruim'));
  document.getElementById('fcd-gen-otimo').addEventListener('click',   () => genDay('otimo'));
  document.getElementById('fcd-gen-agitado').addEventListener('click', () => genDay('agitado'));
  document.getElementById('fcd-gen-week').addEventListener('click',    genWeek);

  /* ══════════════════════════════════════
     EXPORTAR / IMPORTAR / LIMPAR
  ══════════════════════════════════════ */

  document.getElementById('fcd-export').addEventListener('click', () => {
    const data = {
      exported_at:      new Date().toISOString(),
      fc_events:        JSON.parse(localStorage.getItem('fc_events')        || '[]'),
      fc_humor_history: JSON.parse(localStorage.getItem('fc_humor_history') || '[]'),
      fc_checkouts:     JSON.parse(localStorage.getItem('fc_checkouts')     || '[]'),
      fc_profile:       JSON.parse(localStorage.getItem('fc_profile')       || 'null'),
      fc_time_offset:   getOffset(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fala-comigo-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log(`📤 Exportado: ${data.fc_events.length} eventos`, 'ok');
    showToast('📤 Backup exportado!');
  });

  document.getElementById('fcd-import-btn').addEventListener('click', () => {
    document.getElementById('fcd-import-file').click();
  });

  document.getElementById('fcd-import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.fc_events)        localStorage.setItem('fc_events',        JSON.stringify(data.fc_events));
        if (data.fc_humor_history) localStorage.setItem('fc_humor_history', JSON.stringify(data.fc_humor_history));
        if (data.fc_checkouts)     localStorage.setItem('fc_checkouts',     JSON.stringify(data.fc_checkouts));
        if (data.fc_profile)       localStorage.setItem('fc_profile',       JSON.stringify(data.fc_profile));
        if (data.fc_time_offset)   setOffset(data.fc_time_offset);
        updateStats();
        updateClock();
        _notifyRerender();
        log(`📥 Importado: ${(data.fc_events||[]).length} eventos`, 'ok');
        showToast('📥 Dados importados!');
      } catch {
        log('❌ JSON inválido', 'err');
        showToast('❌ Arquivo inválido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('fcd-clear').addEventListener('click', () => {
    if (!confirm('Apagar TODOS os eventos, humor e checkouts?')) return;
    ['fc_events','fc_humor_history','fc_checkouts'].forEach(k => localStorage.removeItem(k));
    updateStats();
    log('🗑️ Dados apagados', 'warn');
    showToast('🗑️ Dados apagados');

    /* ── Notifica todas as abas/iframes para re-renderizar ── */
    try {
      localStorage.setItem('fc_evt_fc_clear', JSON.stringify({ detail: {}, ts: Date.now() }));
      setTimeout(() => localStorage.removeItem('fc_evt_fc_clear'), 200);
      window.dispatchEvent(new CustomEvent('fc_clear', { detail: {} }));
    } catch {}
  });

  /* ══════════════════════════════════════
     INIT — padrão 01/01/2026 12:00
  ══════════════════════════════════════ */

  if (!getFixed()) {
    saveFixed(new Date(2026, 0, 1, 12, 0, 0, 0));
  }

  updateClock();
  updateStats();

})();