/* ══════════════════════════════════════════
   cuidador.js — Fala Comigo
   Lê todos os dados do state.js (localStorage).
   Atualiza automaticamente quando a criança
   interage (mesmo em outra aba).
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
  if (event.type === 'sos') {
    return { cls: 'sos', badge: 'b-sos', bt: 'SOS' };
  }
  if (event.type === 'humor') {
    if (event.mood === 'bem')    return { cls: '',     badge: 'b-ok',   bt: 'Ótimo' };
    if (event.mood === 'mal')    return { cls: 'ruim', badge: 'b-ruim', bt: 'Atenção' };
    return { cls: '', badge: 'b-ped', bt: 'Humor' };
  }
  if (event.type === 'need') {
    return { cls: '', badge: 'b-ped', bt: 'Pedido' };
  }
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
  const feedEl   = document.getElementById('feed');
  const countEl  = document.getElementById('feedCount');
  const events   = FalaComigo.getEvents(true); // só hoje

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

    card.innerHTML = `
      <div class="ec-bull"></div>
      <span class="ec-ico">${e.icon}</span>
      <div class="ec-c">
        <p class="ec-msg">${e.message}</p>
        <div class="ec-meta">
          <span class="ec-time">${e.time}</span>
          <span class="badge ${badge}">${bt}</span>
          ${e.note ? `<span class="badge b-ped">📝 Nota</span>` : ''}
        </div>
      </div>
      <span class="ec-st">${stIcon}</span>
    `;

    card.addEventListener('click', () => abrirDetalhe(e));
    feedEl.appendChild(card);
  });

  // Mostra alerta SOS se houver SOS pendente
  const sosPendente = events.find(e => e.type === 'sos' && e.status === 'pending');
  const sosAlert = document.getElementById('sosAlert');
  if (sosPendente) {
    sosAlert.classList.remove('hidden');
    sosAlert.querySelector('.sos-t').textContent = 'SOS — ' + FalaComigo.getProfile().name;
  } else {
    sosAlert.classList.add('hidden');
  }

  // Atualiza sugestão automática
  atualizarSugestao(events);
}

/* ── SUGESTÃO AUTOMÁTICA ── */
function atualizarSugestao(events) {
  const sugCard = document.getElementById('sugCard');
  const sugTx   = document.getElementById('sugTx') || sugCard.querySelector('.sug-tx');

  const pending = events.filter(e => e.status === 'pending');
  if (!pending.length) {
    sugCard.classList.add('hidden');
    return;
  }

  // Prioridade: SOS > mal > necessidades
  const sos   = pending.find(e => e.type === 'sos');
  const mal   = pending.find(e => e.type === 'humor' && e.mood === 'mal');
  const need  = pending.find(e => e.type === 'need');

  let sugestao = null;
  if (sos)  sugestao = { msg: sos.message,  sug: 'Atender imediatamente — SOS ativo.' };
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

  document.getElementById('dIco').textContent  = e.icon;
  document.getElementById('dMsg').textContent  = e.message;
  document.getElementById('dTime').textContent = '🕒 ' + e.time;
  document.getElementById('dEmo').textContent  = e.type === 'humor'
    ? e.icon + ' ' + ({ bem: 'Bem', normal: 'Normal', mal: 'Mal' }[e.mood] || '—')
    : '—';
  document.getElementById('dPed').textContent  = e.type === 'need'
    ? e.icon + ' ' + e.message.replace(/^[^\s]+\s/, '')
    : '—';
  document.getElementById('dSug').textContent  = e.type === 'need'
    ? getSugestaoNeed(e.need)
    : e.type === 'sos'
      ? 'Atender imediatamente.'
      : 'Monitorar a situação.';

  // Nota existente
  const notaIn = document.getElementById('notaIn');
  notaIn.value = e.note || '';
  document.getElementById('notaBox').classList.remove('open');

  goTo('detail');
}

/* ── TOAST ── */
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

/* ── GRÁFICO DE HUMOR ── */
function renderHumorChart() {
  const container = document.getElementById('humorChart');
  container.innerHTML = '';

  const history = FalaComigo.getHumorHistory(7);

  history.forEach(day => {
    const wrap = document.createElement('div');
    wrap.className = 'hcw';

    const bar = document.createElement('div');
    bar.className = 'hcb';
    bar.style.height = '0';
    // Cor diferente se não houve dados
    if (day.avg === null) bar.style.background = '#d0ead8';

    const label = document.createElement('div');
    label.className = 'hcd';
    label.textContent = day.label;

    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);

    setTimeout(() => {
      bar.style.height = day.avg !== null
        ? (day.avg * 0.58) + 'px'
        : '4px';
    }, 300);
  });
}

/* ── GRÁFICO DE NECESSIDADES ── */
function renderNeedsChart() {
  const container = document.getElementById('needsChart');
  container.innerHTML = '';

  const stats = FalaComigo.getTodayStats();

  // Se não houver dados, usa fallback visual
  let dados = stats.topNeeds.map(n => ({
    l: needLabel(n.need),
    p: Math.min(100, Math.round((n.count / Math.max(...stats.topNeeds.map(x => x.count))) * 100)),
  }));

  if (!dados.length) {
    dados = [{ l: 'Sem dados', p: 0 }];
  }

  dados.forEach(n => {
    const row = document.createElement('div');
    row.className = 'nc-r';
    row.innerHTML = `
      <span class="nc-l">${n.l}</span>
      <div class="nc-tk"><div class="nc-fl" data-p="${n.p}"></div></div>
      <span class="nc-p">${n.p}%</span>
    `;
    container.appendChild(row);
    setTimeout(() => {
      row.querySelector('.nc-fl').style.width = n.p + '%';
    }, 400);
  });
}

function needLabel(need) {
  const map = {
    agua: 'Água', banheiro: 'Banheiro', descanso: 'Descanso',
    abraco: 'Abraço', silencio: 'Silêncio', 'ir-embora': 'Ir embora',
  };
  return map[need] || need;
}

/* ── ATUALIZAR STATS DO RELATÓRIO ── */
function updateStats() {
  const stats = FalaComigo.getTodayStats();
  const eventos  = document.getElementById('statEventos');
  const sosStat  = document.getElementById('statSOS');
  const notaStat = document.getElementById('statNota');

  if (eventos)  eventos.textContent  = stats.total;
  if (sosStat)  sosStat.textContent  = stats.sos;
  if (notaStat) {
    const checkout = FalaComigo.getTodayCheckout();
    notaStat.textContent = checkout ? checkout.rating + '.0' : '—';
  }
}

/* ── LISTENERS DE EVENTOS ── */
function setupEventListeners() {

  // Topbar
  document.getElementById('btnRel').addEventListener('click', () => {
    renderHumorChart();
    renderNeedsChart();
    updateStats();
    goTo('rel');
  });
  document.getElementById('btnCo').addEventListener('click', () => goTo('checkout'));

  // Voltar
  ['bk1','bk2','bk3'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => goTo('feed'));
  });

  // Fechar SOS
  document.getElementById('sosDismiss').addEventListener('click', () => {
    document.getElementById('sosAlert').classList.add('hidden');
  });

  // Fechar sugestão
  document.getElementById('sugDismiss').addEventListener('click', () => {
    document.getElementById('sugCard').classList.add('hidden');
  });

  // Ações rápidas
  document.querySelectorAll('[data-a]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.a;
      const status = action === 'resolvido' ? 'resolved' : 'watching';
      if (currentEventId) {
        FalaComigo.updateEvent(currentEventId, status);
      }
      const msg = status === 'resolved' ? '✔ Marcado como resolvido' : '⏳ Em acompanhamento';
      showToast(msg);
      setTimeout(() => { renderFeed(); goTo('feed'); }, 700);
    });
  });

  // Toggle nota
  document.getElementById('btnNota').addEventListener('click', () => {
    document.getElementById('notaBox').classList.toggle('open');
  });

  // Salvar nota
  document.getElementById('notaSv').addEventListener('click', () => {
    const val = document.getElementById('notaIn').value.trim();
    if (!val) { showToast('Escreva algo antes de salvar'); return; }
    if (currentEventId) {
      FalaComigo.updateEvent(currentEventId, 'resolved', val);
    }
    showToast('📝 Nota salva!');
    document.getElementById('notaBox').classList.remove('open');
    document.getElementById('notaIn').value = '';
    setTimeout(() => { renderFeed(); goTo('feed'); }, 700);
  });

  // Salvar checkout
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

  // Ripple
  document.querySelectorAll('.rh').forEach(el => {
    el.addEventListener('click', e => addRipple(el, e));
  });

  /* ════════════════════════════════════════
     TEMPO REAL — escuta eventos da criança
     Funciona mesmo se ela estiver em outra aba
  ════════════════════════════════════════ */
  FalaComigo.on('fc_new_event', (event) => {
    renderFeed();

    // Notificação visual de novo evento
    const tipo = event.type === 'sos'   ? '🚨 SOS recebido!'
               : event.type === 'humor' ? '💬 Humor atualizado'
               : '📩 Nova mensagem';
    showToast(tipo + ' — ' + event.message);
  });

  FalaComigo.on('fc_event_updated', () => {
    renderFeed();
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  // Carrega nome do perfil
  const profile = FalaComigo.getProfile();
  const nameEl  = document.querySelector('.tb-name');
  if (nameEl) {
    // Mantém nome da cuidadora fixo, mas mostra o nome da criança na topbar
    // Você pode customizar isso conforme precisar
  }

  renderFeed();
  renderStars();
  setupEventListeners();
});