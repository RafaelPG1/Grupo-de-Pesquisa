/* ══════════════════════════════════════════
   cuidador/cuidador.js — ConecTEA v2
   Relatório reescrito: bugs corrigidos,
   horários críticos reais, gráficos vivos,
   relatório semanal/mensal e exportação texto.
══════════════════════════════════════════ */

'use strict';

/* ── NAVEGAÇÃO ── */
let currentScreen = 'feed';

const screenMap = {
  feed:     's-feed',
  detail:   's-detail',
  checkout: 's-checkout',
  rel:      's-rel',
};

function goTo(name) {
  const cur = document.getElementById(screenMap[currentScreen]);
  const nxt = document.getElementById(screenMap[name]);
  cur.classList.remove('active');
  cur.classList.add('out');
  setTimeout(() => cur.classList.remove('out'), 280);
  nxt.classList.add('active');
  currentScreen = name;
}

/* ── MAPEAMENTO: tipo de evento → badge ── */
function getBadgeInfo(event) {
  if (event.type === 'sos')  return { cls: 'sos', badge: 'b-sos', bt: 'SOS' };
  if (event.type === 'humor') {
    if (event.mood === 'bem')  return { cls: '',     badge: 'b-ok',   bt: 'Ótimo' };
    if (event.mood === 'mal')  return { cls: 'ruim', badge: 'b-ruim', bt: 'Atenção' };
    return { cls: '', badge: 'b-ped', bt: 'Humor' };
  }
  if (event.type === 'need') return { cls: '', badge: 'b-ped', bt: 'Pedido' };
  return { cls: '', badge: 'b-ok', bt: 'Info' };
}

function getStatusIcon(status) {
  if (status === 'resolved') return '✔';
  if (status === 'watching') return '⏳';
  return '';
}

/* ── RENDERIZAR FEED ── */
let currentEventId = null;

function renderFeed() {
  const feedEl  = document.getElementById('feed');
  const countEl = document.getElementById('feedCount');
  const events  = FalaComigo.getEvents(true);

  feedEl.innerHTML = '';

  if (events.length === 0) {
    feedEl.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--tx3);">
        <p style="font-size:32px;margin-bottom:8px">🌱</p>
        <p style="font-size:13px;font-weight:800;">Nenhuma interação hoje ainda.</p>
        <p style="font-size:11px;margin-top:4px;">As ações da criança aparecerão aqui.</p>
      </div>`;
    countEl.textContent = '0';
    return;
  }

  countEl.textContent = events.length;

  events.forEach((e, i) => {
    const { cls, badge, bt } = getBadgeInfo(e);
    const stIcon = getStatusIcon(e.status);

    const card = document.createElement('div');
    card.className = `ec ${cls}`;
    card.style.animationDelay = `${Math.min(i, 8) * 0.06}s`;
    card.dataset.id = e.id;

    const profile = FalaComigo.getProfile();
    card.innerHTML = `
      <div class="ec-bull"></div>
      <div class="ec-ico">${e.icon}</div>
      <div class="ec-c">
        <p class="ec-msg">${e.message}</p>
        <div class="ec-meta">
          <span class="ec-time">${e.time}</span>
          <span class="ec-child">${profile.name || 'Criança'}</span>
          <span class="badge ${badge}">${bt}</span>
          ${e.note ? `<span class="badge b-ped">📝 Nota</span>` : ''}
        </div>
      </div>
      <span class="ec-st">${stIcon}</span>
    `;

    card.addEventListener('click', () => abrirDetalhe(e));
    feedEl.appendChild(card);
  });

  // SOS pendente
  const sosPendente = events.find(e => e.type === 'sos' && e.status === 'pending');
  const sosAlert = document.getElementById('sosAlert');
  if (sosPendente) {
    sosAlert.classList.remove('hidden');
    sosAlert.querySelector('.sos-t').textContent = 'SOS — ' + FalaComigo.getProfile().name;
  } else {
    sosAlert.classList.add('hidden');
  }

  atualizarSugestao(events);
}

/* ── SUGESTÃO AUTOMÁTICA ── */
function atualizarSugestao(events) {
  const sugCard = document.getElementById('sugCard');
  const sugTx   = document.getElementById('sugTx');

  const pending = events.filter(e => e.status === 'pending');
  if (!pending.length) { sugCard.classList.add('hidden'); return; }

  const sos  = pending.find(e => e.type === 'sos');
  const mal  = pending.find(e => e.type === 'humor' && e.mood === 'mal');
  const need = pending.find(e => e.type === 'need');

  let sugestao = null;
  if (sos)       sugestao = { msg: sos.message,  sug: 'Atender imediatamente — SOS ativo.' };
  else if (mal)  sugestao = { msg: mal.message,  sug: 'Verificar o bem-estar da criança.' };
  else if (need) sugestao = { msg: need.message, sug: getSugestaoNeed(need.need) };

  if (sugestao) {
    sugCard.classList.remove('hidden');
    if (sugTx) sugTx.textContent = `${sugestao.msg} — ${sugestao.sug}`;
  } else {
    sugCard.classList.add('hidden');
  }
}

function getSugestaoNeed(need) {
  const map = {
    'agua':      'Oferecer copo de água agora.',
    'banheiro':  'Acompanhar ao banheiro imediatamente.',
    'descanso':  'Permitir pausa de 5–10 minutos.',
    'abraco':    'Momento de acolhimento afetivo.',
    'silencio':  'Levar para ambiente mais calmo.',
    'ir-embora': 'Verificar se está com desconforto.',
  };
  return map[need] || 'Verificar a necessidade da criança.';
}

/* ── ABRIR DETALHE ── */
function abrirDetalhe(e) {
  currentEventId = e.id;

  const todayEvents = FalaComigo.getEvents(true);
  const lastHumor   = todayEvents.find(ev =>
    ev.type === 'humor' && ev.time <= e.time && ev.id !== e.id
  ) || todayEvents.find(ev => ev.type === 'humor');

  document.getElementById('dIco').textContent  = e.icon;
  document.getElementById('dMsg').textContent  = e.message;
  document.getElementById('dTime').textContent = '🕒 ' + e.time;

  const humorRef = e.type === 'humor' ? e : lastHumor;
  document.getElementById('dEmo').textContent = humorRef
    ? humorRef.icon + ' ' + ({ bem: 'Bem', normal: 'Normal', mal: 'Mal' }[humorRef.mood] || '—')
    : '—';

  document.getElementById('dPed').textContent = e.type === 'need'
    ? e.icon + ' ' + e.message.replace(/^[^\s]+\s/, '')
    : '—';
  document.getElementById('dSug').textContent = e.type === 'need'
    ? getSugestaoNeed(e.need)
    : e.type === 'sos'
      ? 'Atender imediatamente.'
      : 'Monitorar a situação.';

  const notaIn = document.getElementById('notaIn');
  notaIn.value = e.note || '';
  document.getElementById('notaBox').classList.remove('open');

  goTo('detail');
}

/* ══════════════════════════════════════════
   RELATÓRIO — FUNÇÕES PRINCIPAIS
══════════════════════════════════════════ */

/* Período ativo no relatório */
let relPeriodo = 'hoje'; // 'hoje' | 'semana' | 'mes'

/* ── HELPER: gera string de data local YYYY-MM-DD ── */
function dateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/* ── HELPER: data "hoje" respeitando o offset do DevTools ── */
function hojeStr() {
  return dateStr(FalaComigo.getSimulatedDate());
}

/* ── HELPER: eventos no período ── */
function getEventosPeriodo(periodo) {
  const todos = FalaComigo.getEvents(false);
  const hoje  = hojeStr();

  if (periodo === 'hoje') {
    return todos.filter(e => e.date === hoje);
  }
  if (periodo === 'semana') {
    const ini = FalaComigo.getSimulatedDate();
    ini.setDate(ini.getDate() - 6);
    return todos.filter(e => e.date >= dateStr(ini) && e.date <= hoje);
  }
  if (periodo === 'mes') {
    const ini = FalaComigo.getSimulatedDate();
    ini.setDate(ini.getDate() - 29);
    return todos.filter(e => e.date >= dateStr(ini) && e.date <= hoje);
  }
  return todos;
}

/* ── STATS CARDS ── */
function updateRelStats(periodo) {
  const events  = getEventosPeriodo(periodo);
  const total   = events.length;
  const sosCnt  = events.filter(e => e.type === 'sos').length;
  const checkout = FalaComigo.getTodayCheckout();

  document.getElementById('statEventos').textContent = total;
  document.getElementById('statSOS').textContent     = sosCnt;
  document.getElementById('statNota').textContent    = checkout ? checkout.rating + '.0' : '—';

  // Médias de humor no período
  const humorEvs = events.filter(e => e.type === 'humor');
  const avgHumor = humorEvs.length
    ? Math.round(humorEvs.reduce((s, e) => s + ({bem:85,normal:50,mal:20}[e.mood]??50), 0) / humorEvs.length)
    : null;

  const humorEl = document.getElementById('statHumor');
  if (humorEl) {
    if (avgHumor === null) { humorEl.textContent = '—'; }
    else if (avgHumor >= 70) { humorEl.textContent = '😄'; }
    else if (avgHumor >= 40) { humorEl.textContent = '😐'; }
    else                     { humorEl.textContent = '😢'; }
  }
}

/* ── INSTÂNCIAS DOS GRÁFICOS Chart.js ── */
const _charts = {};

function _destroyChart(key) {
  if (_charts[key]) { _charts[key].destroy(); delete _charts[key]; }
}

/* ── GRÁFICO DE HUMOR — barras verticais (Chart.js) ── */
function renderHumorChart(periodo) {
  const container = document.getElementById('humorChart');

  // Monta slots de datas
  const dias = periodo === 'mes' ? 30 : periodo === 'semana' ? 7 : 7;
  const slots = [];
  const history = JSON.parse(localStorage.getItem('fc_humor_history') || '[]');

  for (let i = dias - 1; i >= 0; i--) {
    const d = FalaComigo.getSimulatedDate();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const label = periodo === 'mes'
      ? String(d.getDate()).padStart(2, '0')
      : ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    const dayEntries = history.filter(h => h.date === ds);
    const avg = dayEntries.length
      ? Math.round(dayEntries.reduce((s, h) => s + h.score, 0) / dayEntries.length)
      : null;
    slots.push({ label: periodo === 'mes' ? (parseInt(label) % 5 === 0 ? label : '') : label, avg });
  }

  const labels = slots.map(s => s.label);
  const data   = slots.map(s => s.avg !== null ? s.avg : 0);
  const colors = slots.map(s =>
    s.avg === null ? '#e0e0e0' : s.avg >= 70 ? '#22a862' : s.avg >= 40 ? '#f5c842' : '#e8455a'
  );

  // Cria canvas se não existir
  container.innerHTML = '<canvas id="chartHumor" role="img" aria-label="Gráfico de barras do humor da criança">Humor da criança por dia.</canvas>';
  _destroyChart('humor');

  _charts['humor'] = new Chart(document.getElementById('chartHumor'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: {
          label: ctx => {
            const v = ctx.raw;
            if (v === 0) return 'Sem dados';
            return v >= 70 ? 'Bem 😄' : v >= 40 ? 'Normal 😐' : 'Mal 😢';
          }
        }
      }},
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa' }, border: { display: false } },
        y: { display: false, min: 0, max: 100 },
      }
    }
  });
}

/* ── GRÁFICO DE FREQUÊNCIA — linha (Chart.js) ── */
function renderFreqChart(periodo) {
  const container = document.getElementById('freqChart');
  if (!container) return;

  const dias = periodo === 'mes' ? 30 : 7;
  const todos = FalaComigo.getEvents(false);
  const slots = [];

  for (let i = dias - 1; i >= 0; i--) {
    const d  = FalaComigo.getSimulatedDate();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const label = periodo === 'mes'
      ? String(d.getDate()).padStart(2, '0')
      : ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    const count = todos.filter(e => e.date === ds).length;
    slots.push({ label: periodo === 'mes' ? (parseInt(label) % 5 === 0 ? label : '') : label, count });
  }

  container.innerHTML = '<canvas id="chartFreq" role="img" aria-label="Frequência de uso por dia">Número de interações por dia.</canvas>';
  _destroyChart('freq');

  _charts['freq'] = new Chart(document.getElementById('chartFreq'), {
    type: 'line',
    data: {
      labels: slots.map(s => s.label),
      datasets: [{
        data: slots.map(s => s.count),
        borderColor: '#378add',
        backgroundColor: 'rgba(55,138,221,.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#378add',
        pointRadius: 3,
        pointBorderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw + ' interações' } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa' }, border: { display: false } },
        y: { display: false, min: 0 },
      }
    }
  });
}

/* ── GRÁFICO PIZZA — tipos de interação (Chart.js) ── */
function renderPizzaChart(periodo) {
  const container = document.getElementById('pizzaChart');
  if (!container) return;

  const events = getEventosPeriodo(periodo);
  const humor  = events.filter(e => e.type === 'humor').length;
  const need   = events.filter(e => e.type === 'need').length;
  const sos    = events.filter(e => e.type === 'sos').length;
  const total  = humor + need + sos || 1;

  const dados = [
    { l: 'Humor',      v: humor, c: '#22a862' },
    { l: 'Necessidade',v: need,  c: '#378add' },
    { l: 'SOS',        v: sos,   c: '#e8455a' },
  ].filter(d => d.v > 0);

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px 12px">
      <div style="position:relative;width:76px;height:76px;flex-shrink:0">
        <canvas id="chartPizza" role="img" aria-label="Gráfico pizza dos tipos de interação">Distribuição de interações.</canvas>
      </div>
      <div id="pizzaLeg" style="display:flex;flex-direction:column;gap:5px;font-size:11px;color:#555"></div>
    </div>`;
  _destroyChart('pizza');

  _charts['pizza'] = new Chart(document.getElementById('chartPizza'), {
    type: 'doughnut',
    data: {
      labels: dados.map(d => d.l),
      datasets: [{
        data: dados.map(d => d.v),
        backgroundColor: dados.map(d => d.c),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => {
        const pct = Math.round((ctx.raw / total) * 100);
        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
      }}}}
    }
  });

  // Legenda manual
  const leg = document.getElementById('pizzaLeg');
  if (leg) {
    leg.innerHTML = dados.map(d => {
      const pct = Math.round((d.v / total) * 100);
      return `<span style="display:flex;align-items:center;gap:5px">
        <span style="width:8px;height:8px;border-radius:2px;background:${d.c};flex-shrink:0"></span>
        <span>${d.l} <strong style="color:#1a1a1a">${pct}%</strong></span>
      </span>`;
    }).join('');
  }
}

/* ── GRÁFICO DE FREQUÊNCIA — linha (Chart.js) ── */
function renderFreqChart(periodo) {
  const container = document.getElementById('freqChart');
  if (!container) return;

  const dias = periodo === 'mes' ? 30 : 7;
  const todos = FalaComigo.getEvents(false);
  const slots = [];

  for (let i = dias - 1; i >= 0; i--) {
    const d  = FalaComigo.getSimulatedDate();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const label = periodo === 'mes'
      ? String(d.getDate()).padStart(2, '0')
      : ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    const count = todos.filter(e => e.date === ds).length;
    slots.push({ label: periodo === 'mes' ? (parseInt(label) % 5 === 0 ? label : '') : label, count });
  }

  container.innerHTML = '<canvas id="chartFreq" role="img" aria-label="Frequência de uso por dia">Número de interações por dia.</canvas>';
  _destroyChart('freq');

  _charts['freq'] = new Chart(document.getElementById('chartFreq'), {
    type: 'line',
    data: {
      labels: slots.map(s => s.label),
      datasets: [{
        data: slots.map(s => s.count),
        borderColor: '#378add',
        backgroundColor: 'rgba(55,138,221,.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#378add',
        pointRadius: 3,
        pointBorderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw + ' interações' } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa' }, border: { display: false } },
        y: { display: false, min: 0 },
      }
    }
  });
}

/* ── GRÁFICO PIZZA — tipos de interação (Chart.js) ── */
function renderPizzaChart(periodo) {
  const container = document.getElementById('pizzaChart');
  if (!container) return;

  const events = getEventosPeriodo(periodo);
  const humor  = events.filter(e => e.type === 'humor').length;
  const need   = events.filter(e => e.type === 'need').length;
  const sos    = events.filter(e => e.type === 'sos').length;
  const total  = humor + need + sos || 1;

  const dados = [
    { l: 'Humor',       v: humor, c: '#22a862' },
    { l: 'Necessidade', v: need,  c: '#378add' },
    { l: 'SOS',         v: sos,   c: '#e8455a' },
  ].filter(d => d.v > 0);

  container.innerHTML = `
    <div class="pizza-inner">
      <div class="pizza-canvas-wrap">
        <canvas id="chartPizza" role="img" aria-label="Gráfico pizza dos tipos de interação">Distribuição de interações.</canvas>
      </div>
      <div class="pizza-leg" id="pizzaLeg"></div>
    </div>`;
  _destroyChart('pizza');

  if (!dados.length) {
    container.innerHTML = '<div class="nc-empty">Nenhum dado disponível</div>';
    return;
  }

  _charts['pizza'] = new Chart(document.getElementById('chartPizza'), {
    type: 'doughnut',
    data: {
      labels: dados.map(d => d.l),
      datasets: [{
        data: dados.map(d => d.v),
        backgroundColor: dados.map(d => d.c),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => {
        const pct = Math.round((ctx.raw / total) * 100);
        return `${ctx.label}: ${ctx.raw} (${pct}%)`;
      }}}}
    }
  });

  const leg = document.getElementById('pizzaLeg');
  if (leg) {
    leg.innerHTML = dados.map(d => {
      const pct = Math.round((d.v / total) * 100);
      return `<div class="pizza-leg-item">
        <span class="pizza-leg-dot" style="background:${d.c}"></span>
        <span>${d.l} <strong style="color:#1a1a1a">${pct}%</strong></span>
      </div>`;
    }).join('');
  }
}

/* ── RESUMO TEXTUAL AUTOMÁTICO ── */
function renderResumoTexto(periodo) {
  const el = document.getElementById('resumoTxt');
  if (!el) return;

  const events  = getEventosPeriodo(periodo);
  const profile = FalaComigo.getProfile();
  const nome    = profile.name || 'A criança';
  const total   = events.length;
  const sosCnt  = events.filter(e => e.type === 'sos').length;

  const humorEvs = events.filter(e => e.type === 'humor');
  const bom  = humorEvs.filter(e => e.mood === 'bem').length;
  const mal  = humorEvs.filter(e => e.mood === 'mal').length;
  const norm = humorEvs.filter(e => e.mood === 'normal').length;
  const humPred = bom >= norm && bom >= mal ? 'bom' : norm >= mal ? 'normal' : 'baixo';
  const humEmoji = humPred === 'bom' ? '😄' : humPred === 'normal' ? '😐' : '😢';

  const needCounts = {};
  events.filter(e => e.type === 'need').forEach(e => {
    needCounts[e.need] = (needCounts[e.need] || 0) + 1;
  });
  const topNeed = Object.entries(needCounts).sort((a, b) => b[1] - a[1])[0];

  const checkout = FalaComigo.getTodayCheckout();
  const labels = { hoje: 'hoje', semana: 'nos últimos 7 dias', mes: 'nos últimos 30 dias' };

  const criticos = events.filter(e => e.type === 'sos' || (e.type === 'humor' && e.mood === 'mal'));
  let horarioCritico = '';
  if (criticos.length) {
    const horas = criticos.map(e => e.time ? parseInt(e.time.slice(0,2)) : null).filter(Boolean);
    if (horas.length) {
      const counts = {};
      horas.forEach(h => counts[h] = (counts[h] || 0) + 1);
      const peakH = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
      horarioCritico = ` O horário mais crítico foi às <strong>${peakH}h</strong>.`;
    }
  }

  let resumo = `<strong>${nome}</strong> registrou <strong>${total}</strong> interação${total !== 1 ? 'ões' : ''} ${labels[periodo]}.`;
  if (sosCnt > 0) resumo += ` Houve <strong>${sosCnt}</strong> alerta${sosCnt > 1 ? 's' : ''} SOS.`;
  resumo += ` O humor predominante foi <strong>${humPred} ${humEmoji}</strong>.`;
  if (horarioCritico) resumo += horarioCritico;
  if (topNeed) resumo += ` A necessidade mais pedida foi <strong>${needLabel(topNeed[0])}</strong> (${topNeed[1]}x).`;
  if (checkout) resumo += ` Nota do dia: <strong>${checkout.rating}/10</strong>.`;

  el.innerHTML = resumo;
}


function renderHorariosCriticos(periodo) {
  const container = document.getElementById('critList');
  container.innerHTML = '';

  const events = getEventosPeriodo(periodo);

  // Eventos críticos = SOS + humor "mal"
  const criticos = events.filter(e => e.type === 'sos' || (e.type === 'humor' && e.mood === 'mal'));

  if (!criticos.length) {
    container.innerHTML = `
      <div class="crit-empty">
        <span>✅</span>
        <span>Nenhum horário crítico no período</span>
      </div>`;
    return;
  }

  // Agrupa por hora (HH) para ver concentração
  const porHora = {};
  criticos.forEach(e => {
    const hora = e.time ? e.time.slice(0, 2) + ':00' : '--:--';
    if (!porHora[hora]) porHora[hora] = [];
    porHora[hora].push(e);
  });

  // Ordena por hora e pega top 5
  const ordenados = Object.entries(porHora)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 5);

  ordenados.forEach(([hora, evs]) => {
    const isSOS = evs.some(e => e.type === 'sos');
    const tipos = [...new Set(evs.map(e =>
      e.type === 'sos' ? 'SOS urgente' : 'Humor baixo'
    ))].join(', ');

    const item = document.createElement('div');
    item.className = `crit-i ${isSOS ? 'crit-sos' : 'crit-warn'}`;
    item.innerHTML = `
      <span class="crit-t">${hora}</span>
      <div class="crit-info">
        <span class="crit-d">${tipos}</span>
        <span class="crit-cnt">${evs.length}x ocorrência${evs.length > 1 ? 's' : ''}</span>
      </div>
      <span class="crit-ico">${isSOS ? '🚨' : '⚠️'}</span>
    `;
    container.appendChild(item);
  });
}

/* ── NECESSIDADES MAIS PEDIDAS ── */
function renderNeedsChart(periodo) {
  const container = document.getElementById('needsChart');
  container.innerHTML = '';

  const events = getEventosPeriodo(periodo);
  const needEvs = events.filter(e => e.type === 'need');

  const counts = {};
  needEvs.forEach(e => {
    counts[e.need] = (counts[e.need] || 0) + 1;
  });

  let dados = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([need, count]) => ({
      l: needLabel(need),
      icon: needIcon(need),
      p: count,
    }));

  if (!dados.length) {
    container.innerHTML = `<div class="nc-empty">Nenhuma necessidade registrada no período</div>`;
    return;
  }

  const max = Math.max(...dados.map(d => d.p));

  dados.forEach((n, i) => {
    const pct = Math.round((n.p / max) * 100);
    const row = document.createElement('div');
    row.className = 'nc-r';
    row.style.animationDelay = `${i * 0.07}s`;
    row.innerHTML = `
      <span class="nc-ico">${n.icon}</span>
      <span class="nc-l">${n.l}</span>
      <div class="nc-tk"><div class="nc-fl" style="width:0"></div></div>
      <span class="nc-p">${n.p}x</span>
    `;
    container.appendChild(row);
    requestAnimationFrame(() => {
      setTimeout(() => {
        row.querySelector('.nc-fl').style.width = pct + '%';
      }, 120 + i * 60);
    });
  });
}

/* ── RELATÓRIO TEXTUAL ── */
function gerarRelatorioTexto(periodo) {
  const events   = getEventosPeriodo(periodo);
  const profile  = FalaComigo.getProfile();
  const checkout = FalaComigo.getTodayCheckout();
  const hoje     = FalaComigo.getSimulatedDate().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const labels = { hoje: 'hoje', semana: 'nos últimos 7 dias', mes: 'nos últimos 30 dias' };

  const total   = events.length;
  const sosCnt  = events.filter(e => e.type === 'sos').length;
  const humorBom = events.filter(e => e.type === 'humor' && e.mood === 'bem').length;
  const humorNorm = events.filter(e => e.type === 'humor' && e.mood === 'normal').length;
  const humorMal  = events.filter(e => e.type === 'humor' && e.mood === 'mal').length;

  const needCounts = {};
  events.filter(e => e.type === 'need').forEach(e => {
    needCounts[e.need] = (needCounts[e.need] || 0) + 1;
  });
  const topNeed = Object.entries(needCounts).sort((a,b)=>b[1]-a[1])[0];

  const criticos = events.filter(e => e.type === 'sos' || (e.type === 'humor' && e.mood === 'mal'));

  const linhas = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 RELATÓRIO — ConecTEA`,
    `Criança: ${profile.name} ${profile.avatar}`,
    `Período: ${labels[periodo]} (${hoje})`,
    `Gerado por: Ana Silva — Cuidadora`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📊 RESUMO GERAL`,
    `• Total de interações: ${total}`,
    `• Alertas SOS: ${sosCnt}`,
    `• Humor bem: ${humorBom}x | normal: ${humorNorm}x | mal: ${humorMal}x`,
    topNeed ? `• Necessidade mais pedida: ${needLabel(topNeed[0])} (${topNeed[1]}x)` : '',
    checkout ? `• Nota do dia: ${checkout.rating}/10` : '',
    ``,
    `⚠️ MOMENTOS CRÍTICOS`,
    ...(criticos.length
      ? criticos.slice(0, 5).map(e => `• ${e.time} — ${e.message}`)
      : ['• Nenhum momento crítico registrado']),
    ``,
    `📝 TODOS OS EVENTOS`,
    ...events.slice(0, 20).map(e => `• ${e.time} ${e.icon} ${e.message} [${e.status}]`),
    events.length > 20 ? `  ... e mais ${events.length - 20} eventos` : '',
    ``,
    checkout?.comment ? `💬 OBSERVAÇÃO: ${checkout.comment}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].filter(l => l !== undefined);

  return linhas.join('\n');
}

/* ── EXIBIR RELATÓRIO TEXTUAL ── */
function mostrarRelatorioTexto(periodo) {
  const texto = gerarRelatorioTexto(periodo);
  const modal = document.getElementById('relTextoModal');
  const area  = document.getElementById('relTextoArea');
  if (!modal || !area) return;
  area.textContent = texto;
  modal.classList.add('open');
}

/* ── COPIAR RELATÓRIO ── */
function copiarRelatorio(periodo) {
  const texto = gerarRelatorioTexto(periodo);
  navigator.clipboard?.writeText(texto)
    .then(() => showToast('📋 Relatório copiado!'))
    .catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Relatório copiado!');
    });
}

/* ── LABELS ── */
function needLabel(need) {
  const map = {
    agua: 'Água', banheiro: 'Banheiro', descanso: 'Descanso',
    abraco: 'Abraço', silencio: 'Silêncio', 'ir-embora': 'Ir embora',
  };
  return map[need] || need;
}

function needIcon(need) {
  const map = {
    agua: '💧', banheiro: '🚻', descanso: '😴',
    abraco: '🤗', silencio: '🔇', 'ir-embora': '🚪',
  };
  return map[need] || '📌';
}

/* ── RENDERIZAR RELATÓRIO COMPLETO ── */
function renderRelatorio(periodo) {
  periodo = periodo || relPeriodo;
  relPeriodo = periodo;

  // Atualiza botões de período
  document.querySelectorAll('.rel-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.periodo === periodo);
  });

  updateRelStats(periodo);
  renderHumorChart(periodo);
  renderFreqChart(periodo);
  renderPizzaChart(periodo);
  renderHorariosCriticos(periodo);
  renderNeedsChart(periodo);
  renderResumoTexto(periodo);
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
let toastTimer;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ── RIPPLE ── */
function addRipple(el, event) {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const size = Math.max(el.offsetWidth, el.offsetHeight);
  ripple.style.cssText = `
    width:${size}px;height:${size}px;
    left:${event.clientX - rect.left - size/2}px;
    top:${event.clientY - rect.top - size/2}px;
  `;
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 400);
}

/* ── RATING ── */
let rating = 0;

function renderStars() {
  const container = document.getElementById('ratStars');
  for (let i = 1; i <= 10; i++) {
    const star = document.createElement('button');
    star.className = 'star';
    star.textContent = '⭐';
    star.dataset.v = i;
    star.addEventListener('click', () => {
      rating = i;
      document.getElementById('ratV').textContent = i + '/10';
      document.querySelectorAll('.star').forEach((s, idx) => {
        s.classList.toggle('on', idx < i);
      });
    });
    container.appendChild(star);
  }
}

/* ══════════════════════════════════════════
   LISTENERS
══════════════════════════════════════════ */
function setupEventListeners() {

  document.getElementById('btnRel').addEventListener('click', () => {
    renderRelatorio(relPeriodo);
    goTo('rel');
  });

  document.getElementById('btnCo').addEventListener('click', () => goTo('checkout'));

  ['bk1','bk2','bk3'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => goTo('feed'));
  });

  document.getElementById('sosDismiss').addEventListener('click', () => {
    document.getElementById('sosAlert').classList.add('hidden');
  });

  document.getElementById('sugDismiss').addEventListener('click', () => {
    document.getElementById('sugCard').classList.add('hidden');
  });

  // Ações rápidas no detalhe
  document.querySelectorAll('[data-a]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.dataset.a === 'resolvido' ? 'resolved' : 'watching';
      if (currentEventId) FalaComigo.updateEvent(currentEventId, status);
      showToast(status === 'resolved' ? '✔ Marcado como resolvido' : '⏳ Em acompanhamento');
      setTimeout(() => { renderFeed(); goTo('feed'); }, 700);
    });
  });

  document.getElementById('btnNota').addEventListener('click', () => {
    document.getElementById('notaBox').classList.toggle('open');
  });

  document.getElementById('notaSv').addEventListener('click', () => {
    const val = document.getElementById('notaIn').value.trim();
    if (!val) { showToast('Escreva algo antes de salvar'); return; }
    if (currentEventId) FalaComigo.updateEvent(currentEventId, 'resolved', val);
    showToast('📝 Nota salva!');
    document.getElementById('notaBox').classList.remove('open');
    document.getElementById('notaIn').value = '';
    setTimeout(() => { renderFeed(); goTo('feed'); }, 700);
  });

  document.getElementById('coSv').addEventListener('click', () => {
    if (!rating) { showToast('Dê uma nota antes de salvar'); return; }
    const comment = document.getElementById('comIn').value.trim();
    FalaComigo.saveCheckout(rating, comment);
    showToast('✅ Dia fechado! Boa noite 🌙');
    setTimeout(() => {
      rating = 0;
      document.getElementById('ratV').textContent = '—';
      document.querySelectorAll('.star').forEach(s => s.classList.remove('on'));
      document.getElementById('comIn').value = '';
      goTo('feed');
    }, 900);
  });

  // Tabs de período no relatório
  document.querySelectorAll('.rel-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      renderRelatorio(btn.dataset.periodo);
    });
  });

  // Botão relatório texto
  const btnRelTexto = document.getElementById('btnRelTexto');
  if (btnRelTexto) {
    btnRelTexto.addEventListener('click', () => mostrarRelatorioTexto(relPeriodo));
  }

  // Fechar modal de texto
  const btnFecharModal = document.getElementById('btnFecharModal');
  if (btnFecharModal) {
    btnFecharModal.addEventListener('click', () => {
      document.getElementById('relTextoModal').classList.remove('open');
    });
  }

  // Copiar no modal
  const btnCopiar = document.getElementById('btnCopiarRel');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => copiarRelatorio(relPeriodo));
  }

  // Ripple
  document.querySelectorAll('.rh').forEach(el => {
    el.addEventListener('click', e => addRipple(el, e));
  });

  /* ── TEMPO REAL ── */
  FalaComigo.on('fc_new_event', (event) => {
    renderFeed();
    if (currentScreen === 'rel') renderRelatorio();
    const tipo = event.type === 'sos'   ? '🚨 SOS recebido!'
               : event.type === 'humor' ? '💬 Humor atualizado'
               : '📩 Nova mensagem';
    showToast(tipo + ' — ' + event.message);
  });

  FalaComigo.on('fc_event_updated', () => {
    renderFeed();
    if (currentScreen === 'rel') renderRelatorio();
  });

  const _clearLocal = () => { renderFeed(); if (currentScreen === 'rel') renderRelatorio(); };
  window.addEventListener('fc_clear', _clearLocal);
  window.addEventListener('storage', (e) => {
    if (e.key === 'fc_evt_fc_clear' && e.newValue) _clearLocal();
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  renderFeed();
  renderStars();
  setupEventListeners();
});