/* ══════════════════════════════════════════
   state.js — Fala Comigo
   Gerenciador central de estado compartilhado.
   Usa localStorage para persistir eventos entre
   as telas da criança e do cuidador.
   Usa StorageEvent para comunicação em tempo real
   quando as duas abas estão abertas simultaneamente.
══════════════════════════════════════════ */

'use strict';

const FalaComigo = (() => {

  /* ── CHAVES DO localStorage ── */
  const KEYS = {
    EVENTS:   'fc_events',
    PROFILE:  'fc_profile',
    HUMOR:    'fc_humor_history',
    CHECKOUT: 'fc_checkouts',
  };

  /* ── TIPOS DE EVENTO ── */
  const EVENT_TYPES = {
    HUMOR:    'humor',
    NEED:     'need',
    SOS:      'sos',
  };

  /* ── PERFIL PADRÃO DA CRIANÇA ── */
  const DEFAULT_PROFILE = {
    name:   'Maria',
    avatar: '👧',
    age:    8,
  };

  /* ══════════════════════════════════════
     UTILITÁRIOS
  ══════════════════════════════════════ */

  /**
   * Retorna a data/hora simulada, respeitando o offset do DevTools.
   * O DevTools salva o offset em ms em 'fc_time_offset'.
   */
  function _simulatedDate() {
    const offset = parseInt(localStorage.getItem('fc_time_offset') || '0', 10);
    return new Date(Date.now() + offset);
  }

  function now() {
    const d = _simulatedDate();
    return d.toTimeString().slice(0, 5); // "HH:MM"
  }

  function today() {
    return _simulatedDate().toISOString().slice(0, 10); // "YYYY-MM-DD"
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /* ══════════════════════════════════════
     EVENTOS
  ══════════════════════════════════════ */

  /**
   * Retorna todos os eventos, opcionalmente filtrados pela data de hoje.
   * @param {boolean} onlyToday - se true, só retorna eventos de hoje
   */
  function getEvents(onlyToday = false) {
    const events = read(KEYS.EVENTS) || [];
    if (!onlyToday) return events;
    return events.filter(e => e.date === today());
  }

  /**
   * Adiciona um novo evento ao histórico.
   * @param {string} type - EVENT_TYPES.HUMOR | NEED | SOS
   * @param {string} message - texto da mensagem
   * @param {string} icon - emoji do ícone
   * @param {object} extra - dados extras opcionais
   * @returns {object} - o evento criado
   */
  function addEvent(type, message, icon, extra = {}) {
    const events = read(KEYS.EVENTS) || [];

    const event = {
      id:      uid(),
      type,
      message,
      icon,
      time:    now(),
      date:    today(),
      status:  'pending',  // pending | resolved | watching
      note:    '',
      ...extra,
    };

    events.unshift(event); // mais recente primeiro

    // Limita a 500 eventos para não estourar o storage
    if (events.length > 500) events.splice(500);

    write(KEYS.EVENTS, events);
    _dispatch('fc_new_event', event);
    return event;
  }

  /**
   * Atualiza o status de um evento.
   * @param {string} id - id do evento
   * @param {string} status - 'resolved' | 'watching'
   * @param {string} note - nota opcional do cuidador
   */
  function updateEvent(id, status, note = '') {
    const events = read(KEYS.EVENTS) || [];
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return false;

    events[idx].status = status;
    if (note) events[idx].note = note;

    write(KEYS.EVENTS, events);
    _dispatch('fc_event_updated', events[idx]);
    return true;
  }

  /* ══════════════════════════════════════
     HUMOR
  ══════════════════════════════════════ */

  /**
   * Salva o humor da criança (chamado ao clicar nos emojis).
   * Também registra no histórico semanal.
   * @param {string} mood - 'bem' | 'normal' | 'mal'
   * @param {string} icon - emoji
   * @param {string} message - mensagem completa
   */
  function setHumor(mood, icon, message) {
    // Registra como evento
    const event = addEvent(EVENT_TYPES.HUMOR, message, icon, { mood });

    // Histórico para o gráfico semanal
    const history = read(KEYS.HUMOR) || [];
    const score = { bem: 85, normal: 50, mal: 20 }[mood] ?? 50;

    history.unshift({
      date:  today(),
      time:  now(),
      mood,
      score,
      icon,
    });

    if (history.length > 90) history.splice(90);
    write(KEYS.HUMOR, history);

    return event;
  }

  /**
   * Retorna o histórico de humor dos últimos N dias.
   * Agrupa por dia e calcula a média.
   * @param {number} days - quantos dias retornar
   */
  function getHumorHistory(days = 7) {
    const history = read(KEYS.HUMOR) || [];
    const result  = [];

    for (let i = days - 1; i >= 0; i--) {
      const d     = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];

      const dayEntries = history.filter(h => h.date === dateStr);
      const avg = dayEntries.length
        ? Math.round(dayEntries.reduce((s, h) => s + h.score, 0) / dayEntries.length)
        : null;

      result.push({ date: dateStr, label, avg, entries: dayEntries.length });
    }

    return result;
  }

  /* ══════════════════════════════════════
     SOS
  ══════════════════════════════════════ */

  /**
   * Dispara um SOS — cria um evento de alta prioridade.
   * @param {string} context - contexto opcional (ex: "muito barulho")
   */
  function triggerSOS(context = '') {
    const message = context
      ? `SOS — ${context}`
      : 'SOS — pedido de ajuda urgente';

    return addEvent(EVENT_TYPES.SOS, message, '🚨', {
      priority: 'high',
      context,
    });
  }

  /* ══════════════════════════════════════
     NECESSIDADES
  ══════════════════════════════════════ */

  /**
   * Registra uma necessidade da criança.
   * @param {string} need - identificador (ex: 'agua', 'banheiro')
   * @param {string} icon - emoji
   * @param {string} message - mensagem completa
   */
  function requestNeed(need, icon, message) {
    return addEvent(EVENT_TYPES.NEED, message, icon, { need });
  }

  /* ══════════════════════════════════════
     CHECKOUT DO DIA
  ══════════════════════════════════════ */

  /**
   * Salva o checkout do dia pelo cuidador.
   * @param {number} rating - nota de 1 a 10
   * @param {string} comment - comentário opcional
   */
  function saveCheckout(rating, comment = '') {
    const checkouts = read(KEYS.CHECKOUT) || [];

    checkouts.unshift({
      id:      uid(),
      date:    today(),
      time:    now(),
      rating,
      comment,
    });

    write(KEYS.CHECKOUT, checkouts);
    _dispatch('fc_checkout', { date: today(), rating });
    return true;
  }

  /**
   * Retorna o checkout do dia atual (se existir).
   */
  function getTodayCheckout() {
    const checkouts = read(KEYS.CHECKOUT) || [];
    return checkouts.find(c => c.date === today()) || null;
  }

  /* ══════════════════════════════════════
     PERFIL
  ══════════════════════════════════════ */

  function getProfile() {
    return read(KEYS.PROFILE) || DEFAULT_PROFILE;
  }

  function setProfile(data) {
    write(KEYS.PROFILE, { ...DEFAULT_PROFILE, ...data });
  }

  /* ══════════════════════════════════════
     ESTATÍSTICAS DO DIA (para relatórios)
  ══════════════════════════════════════ */

  function getTodayStats() {
    const events  = getEvents(true);
    const total   = events.length;
    const sos     = events.filter(e => e.type === 'sos').length;
    const pending = events.filter(e => e.status === 'pending').length;

    const humorEvents = events.filter(e => e.type === 'humor');
    const avgHumor    = humorEvents.length
      ? Math.round(
          humorEvents.reduce((s, e) => {
            const score = { bem: 85, normal: 50, mal: 20 }[e.mood] ?? 50;
            return s + score;
          }, 0) / humorEvents.length
        )
      : null;

    // Necessidades mais pedidas hoje
    const needCounts = {};
    events
      .filter(e => e.type === 'need')
      .forEach(e => {
        needCounts[e.need] = (needCounts[e.need] || 0) + 1;
      });

    const topNeeds = Object.entries(needCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([need, count]) => ({ need, count }));

    return { total, sos, pending, avgHumor, topNeeds };
  }

  /* ══════════════════════════════════════
     COMUNICAÇÃO ENTRE ABAS (StorageEvent)
  ══════════════════════════════════════ */

  /**
   * Dispara um evento customizado via localStorage
   * (compatível com StorageEvent para comunicação cross-tab).
   */
  function _dispatch(key, detail) {
    // Trick: escreve no storage para disparar storageEvent nas outras abas
    const payload = JSON.stringify({ detail, ts: Date.now() });
    try {
      localStorage.setItem('fc_evt_' + key, payload);
      // Remove imediatamente — o importante é o storageEvent ter sido disparado
      setTimeout(() => localStorage.removeItem('fc_evt_' + key), 200);
    } catch {}

    // Na mesma aba, dispara CustomEvent para quem escuta
    try {
      window.dispatchEvent(new CustomEvent(key, { detail }));
    } catch {}
  }

  /**
   * Escuta eventos do state (nova interação da criança, etc.).
   * Funciona tanto na mesma aba quanto em abas diferentes.
   *
   * @param {'fc_new_event'|'fc_event_updated'|'fc_checkout'} eventName
   * @param {function} callback - recebe (detail)
   * @returns {function} - chame para remover o listener
   */
  function on(eventName, callback) {
    // Mesma aba
    const localHandler = (e) => callback(e.detail);
    window.addEventListener(eventName, localHandler);

    // Outra aba (StorageEvent)
    const storageKey = 'fc_evt_' + eventName;
    const storageHandler = (e) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const { detail } = JSON.parse(e.newValue);
        callback(detail);
      } catch {}
    };
    window.addEventListener('storage', storageHandler);

    // Retorna função de cleanup
    return () => {
      window.removeEventListener(eventName, localHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }

  /* ══════════════════════════════════════
     LIMPAR DADOS (dev/debug)
  ══════════════════════════════════════ */

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    console.info('[FalaComigo] Storage limpo.');
  }

  /* ══════════════════════════════════════
     API PÚBLICA
  ══════════════════════════════════════ */

  return {
    EVENT_TYPES,

    // Eventos
    getEvents,
    addEvent,
    updateEvent,

    // Humor
    setHumor,
    getHumorHistory,

    // Necessidades
    requestNeed,

    // SOS
    triggerSOS,

    // Checkout
    saveCheckout,
    getTodayCheckout,

    // Perfil
    getProfile,
    setProfile,

    // Relatórios
    getTodayStats,

    // Reatividade
    on,

    // Dev
    clearAll,
    getSimulatedDate: _simulatedDate,
  };
})();

/* Exporta globalmente */
window.FalaComigo = FalaComigo;