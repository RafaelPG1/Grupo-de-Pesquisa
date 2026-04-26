/* ══════════════════════════════════════════
   script.js — criança
   Agora usa FalaComigo (state.js) para persistir
   todas as interações, visíveis em tempo real
   na tela do cuidador.
══════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════
   SPLASH → MAIN
══════════════════════════════════════════ */

const splashEl = document.getElementById('splash');
const mainEl   = document.getElementById('main');
const dotsEls  = document.querySelectorAll('.sp-dot');
let   dotIdx   = 0;

// Carrega nome do perfil no header
const profile = FalaComigo.getProfile();
const hdrName = document.querySelector('.hdr-name');
if (hdrName) hdrName.textContent = profile.name;
const avatarRing = document.querySelector('.avatar-ring');
if (avatarRing) avatarRing.textContent = profile.avatar;

splashEl.classList.add('active');

const dotsTimer = setInterval(() => {
  dotsEls.forEach(d => d.classList.remove('active'));
  dotIdx = (dotIdx + 1) % dotsEls.length;
  dotsEls[dotIdx].classList.add('active');
}, 600);

setTimeout(() => {
  clearInterval(dotsTimer);
  splashEl.classList.add('anim-exit');

  splashEl.addEventListener('animationend', () => {
    splashEl.classList.remove('active', 'anim-exit');
    mainEl.classList.add('active', 'anim-enter');

    mainEl.addEventListener('animationend', (e) => {
      if (e.target === mainEl) mainEl.classList.remove('anim-enter');
    }, { once: true });

  }, { once: true });

}, 2600);


/* ══════════════════════════════════════════
   RIPPLE
══════════════════════════════════════════ */

function spawnRipple(e) {
  const btn  = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x    = clientX - rect.left;
  const y    = clientY - rect.top;
  const size = Math.max(rect.width, rect.height) * 2.2;

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size/2}px;top:${y - size/2}px;`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

document.querySelectorAll('.ripple-host').forEach(el => {
  el.addEventListener('pointerdown', spawnRipple);
});


/* ══════════════════════════════════════════
   HUMOR — agora persiste via state.js
══════════════════════════════════════════ */

document.querySelectorAll('.emo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');

    const mood = btn.dataset.mood;   // 'bem' | 'normal' | 'mal'
    const icon = btn.querySelector('.emo-face').textContent;
    const msg  = btn.dataset.msg;

    // Persiste no state compartilhado
    FalaComigo.setHumor(mood, icon, msg);

    showToast('Enviado: ' + msg);
  });
});


/* ══════════════════════════════════════════
   NECESSIDADES — agora persiste via state.js
══════════════════════════════════════════ */

document.querySelectorAll('.need-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const need = btn.dataset.need;   // ex: 'agua', 'banheiro'
    const icon = btn.querySelector('.need-icon').textContent;
    const msg  = btn.dataset.msg;

    // Persiste no state compartilhado
    FalaComigo.requestNeed(need, icon, msg);

    showToast('Enviado: ' + msg);
  });
});


/* ══════════════════════════════════════════
   VER MAIS
══════════════════════════════════════════ */

const verMaisBtn   = document.getElementById('verMaisBtn');
const verMaisLabel = document.getElementById('verMaisLabel');
const extrasRow    = document.getElementById('extrasRow');
let   extrasOpen   = false;

verMaisBtn.addEventListener('click', () => {
  extrasOpen = !extrasOpen;
  extrasRow.classList.toggle('open', extrasOpen);
  verMaisBtn.classList.toggle('open', extrasOpen);
  verMaisLabel.textContent = extrasOpen ? 'ver menos' : 'ver mais opções';
});


/* ══════════════════════════════════════════
   SOS — agora persiste via state.js
══════════════════════════════════════════ */

document.getElementById('sosBtn').addEventListener('click', () => {
  FalaComigo.triggerSOS();
  showToast('🚨 SOS enviado ao cuidador!');
});


/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */

let toastTimer = null;

function showToast(msg, duration = 2600) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}