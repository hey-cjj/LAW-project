'use strict';

const dialog = document.querySelector('#media-dialog');
const dialogContent = document.querySelector('#dialog-content');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCaption = document.querySelector('#dialog-caption');
const dialogHint = document.querySelector('.dialog-hint');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastFocused = null;

function pauseVideos(except = null) {
  document.querySelectorAll('video').forEach(video => { if (video !== except) video.pause(); });
}

function notify(message) {
  const status = document.querySelector('#media-status');
  status.textContent = message;
  status.classList.add('visible');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => status.classList.remove('visible'), 6500);
}

function monitorVideo(video) {
  video.addEventListener('play', () => pauseVideos(video));
  video.addEventListener('error', () => notify('The video could not load. Please try the download link or refresh the page.'));
}
function showDialog(trigger, title, caption) {
  pauseVideos();
  lastFocused = trigger;
  dialogTitle.textContent = title;
  dialogCaption.textContent = caption;
  dialogHint.hidden = !dialogContent.querySelector('.zoom-stage');
  document.body.classList.add('dialog-open');
  dialog.showModal();
  dialog.querySelector('.dialog-close').focus();
}

document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    dialogContent.replaceChildren();
    const img = document.createElement('img');
    img.src = button.dataset.image;
    img.alt = button.dataset.caption;
    img.draggable = false;
    const stage = document.createElement('div');
    stage.className = 'zoom-stage';
    stage.append(img);
    dialogContent.append(stage);
    enableZoom(stage, img);
    showDialog(button, 'LAW · Figure detail', button.dataset.caption);
  });
});

document.querySelectorAll('.full-video').forEach(button => {
  button.addEventListener('click', () => {
    dialogContent.replaceChildren();
    const video = document.createElement('video');
    video.src = `assets/videos/${button.dataset.task}-full.mp4`;
    video.poster = `assets/images/${button.dataset.task}-poster.jpg`;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', `${button.dataset.title} complete uncut LAW rollout`);
    monitorVideo(video);
    const controls = document.createElement('div');
    controls.className = 'full-video-controls';
    const label = document.createElement('label');
    label.textContent = 'Playback speed';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Playback speed');
    [1, 2, 4, 6].forEach(speed => {
      const option = document.createElement('option');
      option.value = speed;
      option.textContent = `${speed}×`;
      select.append(option);
    });
    select.addEventListener('change', () => { video.playbackRate = Number(select.value); });
    label.append(select);
    const download = document.createElement('a');
    download.href = video.getAttribute('src');
    download.download = `${button.dataset.task}-LAW-full.mp4`;
    download.textContent = 'Download complete video ↓';
    download.className = 'text-link';
    controls.append(label, download);
    dialogContent.append(video, controls);
    showDialog(button, `${button.dataset.title} · Full LAW rollout`, 'Complete, uncut execution. Original timing is preserved at 1×; playback speed can be changed above.');
  });
});
// Wheel or click to zoom a figure, drag to pan while zoomed.
function enableZoom(stage, img) {
  let scale = 1, x = 0, y = 0, drag = null, wheelTimer = null;
  const apply = () => {
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    stage.classList.toggle('zoomed', scale > 1);
  };
  const clamp = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    x = Math.min(0, Math.max(w - w * scale, x));
    y = Math.min(0, Math.max(h - h * scale, y));
  };
  const zoomTo = (next, px, py) => {
    next = Math.min(4, Math.max(1, next));
    x = px - (px - x) * (next / scale);
    y = py - (py - y) * (next / scale);
    scale = next;
    clamp();
    apply();
  };
  const point = event => {
    const rect = stage.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    stage.classList.add('wheeling');
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => stage.classList.remove('wheeling'), 120);
    zoomTo(scale * Math.exp(-event.deltaY * 0.0018), ...point(event));
  }, { passive: false });
  stage.addEventListener('pointerdown', event => {
    drag = { startX: event.clientX, startY: event.clientY, x, y, moved: false };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved && scale > 1) {
      stage.classList.add('dragging');
      x = drag.x + dx;
      y = drag.y + dy;
      clamp();
      apply();
    }
  });
  stage.addEventListener('pointerup', event => {
    if (drag && !drag.moved) zoomTo(scale > 1 ? 1 : 2.5, ...point(event));
    drag = null;
    stage.classList.remove('dragging');
  });
  stage.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging'); });
}

dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  dialogContent.querySelectorAll('video').forEach(video => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  });
  dialogContent.replaceChildren();
  document.body.classList.remove('dialog-open');
  lastFocused?.focus();
});


// Decorative background clips play together, independently of demo controls.
const heroVideos = [...document.querySelectorAll('.hero-video')];
const heroPlayback = document.querySelector('.hero-playback');
let heroPaused = reduceMotion;
let heroVisible = true;
const reelBars = heroVideos.map(video => video.parentElement.querySelector('.reel-progress i'));
let reelFrame = 0;
function drawReelProgress() {
  heroVideos.forEach((video, index) => {
    if (reelBars[index] && video.duration) reelBars[index].style.transform = `scaleX(${video.currentTime / video.duration})`;
  });
  reelFrame = requestAnimationFrame(drawReelProgress);
}
function syncHeroPlayback() {
  const foregroundPlaying = [...document.querySelectorAll('video:not(.hero-video)')].some(video => !video.paused);
  const play = !heroPaused && heroVisible && !document.hidden && !dialog.open && !foregroundPlaying;
  heroVideos.forEach(video => {
    video.muted = true;
    if (play) video.play().catch(() => {});
    else video.pause();
  });
  if (play && !reelFrame) reelFrame = requestAnimationFrame(drawReelProgress);
  if (!play) { cancelAnimationFrame(reelFrame); reelFrame = 0; }
  heroPlayback.textContent = heroPaused ? 'Play' : 'Pause';
  heroPlayback.setAttribute('aria-label', heroPaused ? 'Play videos' : 'Pause videos');
  heroPlayback.setAttribute('aria-pressed', String(heroPaused));
}
heroPlayback.addEventListener('click', () => { heroPaused = !heroPaused; syncHeroPlayback(); });
new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; syncHeroPlayback(); }).observe(document.querySelector('.hero'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseVideos();
  syncHeroPlayback();
});
dialog.addEventListener('close', syncHeroPlayback);
document.querySelectorAll('video:not(.hero-video)').forEach(video => {
  video.addEventListener('pause', syncHeroPlayback);
  video.addEventListener('ended', syncHeroPlayback);
});
syncHeroPlayback();

// Header elevation and section highlighting in the navigation.
const header = document.querySelector('.site-header');
const scrollProgress = document.querySelector('.scroll-progress');
let headerFrame = 0;
function syncHeader() {
  headerFrame = 0;
  header.classList.toggle('scrolled', scrollY > 8);
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollProgress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}
addEventListener('scroll', () => { if (!headerFrame) headerFrame = requestAnimationFrame(syncHeader); }, { passive: true });
addEventListener('resize', syncHeader);
syncHeader();

const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(section => sectionObserver.observe(section));

// Copy BibTeX.
const copyBibtex = document.querySelector('.copy-bibtex');
copyBibtex?.addEventListener('click', async () => {
  const text = document.querySelector('#bibtex-entry').textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#bibtex-entry'));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    document.execCommand('copy');
  }
  copyBibtex.textContent = 'Copied';
  copyBibtex.classList.add('copied');
  clearTimeout(copyBibtex.timer);
  copyBibtex.timer = setTimeout(() => { copyBibtex.textContent = 'Copy'; copyBibtex.classList.remove('copied'); }, 1800);
});

// Count the key numbers up when they come into view.
const counters = [...document.querySelectorAll('[data-count]')];
const decimals = el => (el.dataset.count.split('.')[1] || '').length;
if (!reduceMotion) counters.forEach(el => { el.firstChild.textContent = (0).toFixed(decimals(el)); });
function countUp(el) {
  if (reduceMotion || el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = Number(el.dataset.count), places = decimals(el), start = performance.now(), duration = 1500;
  const frame = now => {
    const t = Math.min(1, (now - start) / duration);
    el.firstChild.textContent = (target * (1 - Math.pow(1 - t, 4))).toFixed(places);
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Reveal content as it scrolls into view.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Control loop: the active step travels Plan → … → Monitor and wraps around.
const cycle = document.querySelector('.control-cycle');
if (cycle && !reduceMotion) {
  const steps = [...cycle.children];
  let index = -1, timer = null, hovering = false, cycleVisible = false;
  const show = active => steps.forEach((step, k) => {
    step.classList.toggle('active', k === active);
    step.classList.toggle('done', k < active);
  });
  const advance = () => {
    const wrapped = index === steps.length - 1;
    index = (index + 1) % steps.length;
    if (wrapped) { cycle.classList.remove('wrap'); void cycle.offsetWidth; cycle.classList.add('wrap'); }
    show(index);
  };
  const run = () => {
    clearInterval(timer);
    timer = null;
    if (!cycleVisible || hovering) return;
    if (index < 0) advance();
    timer = setInterval(advance, 1300);
  };
  steps.forEach((step, k) => step.addEventListener('mouseenter', () => { hovering = true; run(); index = k; show(k); }));
  cycle.addEventListener('mouseleave', () => { hovering = false; run(); });
  new IntersectionObserver(([entry]) => { cycleVisible = entry.isIntersecting; run(); }).observe(cycle);
}

// Value learning: 32 candidates are scored, the top 8 are selected and fused.
const valueCard = document.querySelector('.value-card');
if (valueCard) {
  const viz = valueCard.querySelector('.value-viz');
  const grid = valueCard.querySelector('.chunk-grid');
  const fusedSlot = valueCard.querySelector('.fused-chunk i');
  const chunks = Array.from({ length: 32 }, (_, k) => {
    const chunk = document.createElement('i');
    chunk.className = 'chunk';
    chunk.style.setProperty('--k', k);
    chunk.append(document.createElement('b'));
    grid.append(chunk);
    return chunk;
  });
  let timers = [], running = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const score = () => {
    const values = chunks.map(() => 0.16 + Math.random() * 0.8);
    const top = new Set([...values.keys()].sort((a, b) => values[b] - values[a]).slice(0, 8));
    chunks.forEach((chunk, k) => {
      chunk.style.setProperty('--v', values[k].toFixed(3));
      chunk.classList.toggle('top', top.has(k));
    });
    fusedSlot.style.setProperty('--v', ([...top].reduce((sum, k) => sum + values[k], 0) / 8).toFixed(3));
  };
  const fly = () => {
    const base = viz.getBoundingClientRect();
    const target = fusedSlot.getBoundingClientRect();
    chunks.filter(chunk => chunk.classList.contains('top')).forEach((chunk, n) => {
      const rect = chunk.getBoundingClientRect();
      const clone = chunk.cloneNode(true);
      clone.classList.add('fly');
      Object.assign(clone.style, {
        left: `${rect.left - base.left}px`, top: `${rect.top - base.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`, transitionDelay: `${n * 55}ms`,
      });
      viz.append(clone);
      clone.getBoundingClientRect();
      clone.style.transform = `translate(${target.left + target.width / 2 - rect.left - rect.width / 2}px, ${target.top + target.height / 2 - rect.top - rect.height / 2}px) scale(.55)`;
      clone.style.opacity = '0';
      later(() => clone.remove(), 900 + n * 55);
    });
  };
  const play = () => {
    score();
    valueCard.dataset.phase = 'propose';
    later(() => { valueCard.dataset.phase = 'score'; }, 900);
    later(() => { valueCard.dataset.phase = 'select'; }, 2100);
    later(() => { valueCard.dataset.phase = 'fuse'; fly(); }, 3100);
    later(() => valueCard.classList.add('fused'), 3800);
    later(() => { delete valueCard.dataset.phase; valueCard.classList.remove('fused'); }, 6600);
    later(play, 7500);
  };
  const stop = () => {
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
    viz.querySelectorAll('.fly').forEach(node => node.remove());
    delete valueCard.dataset.phase;
    valueCard.classList.remove('fused');
  };
  if (reduceMotion) {
    score();
    valueCard.dataset.phase = 'select';
    valueCard.classList.add('fused');
  } else {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; play(); }
      else if (!entry.isIntersecting && running) stop();
    }, { threshold: 0.35 }).observe(valueCard);
  }
}

// Real-world charts: hover or pick a method to highlight it in both charts.
const realWorld = document.querySelector('#demonstrations');
const legendItems = [...realWorld.querySelectorAll('.legend-item')];
let lockedSeries = null;
const focusSeries = series => {
  if (series === null) delete realWorld.dataset.focus;
  else realWorld.dataset.focus = series;
};
legendItems.forEach(item => {
  const series = item.dataset.series;
  item.addEventListener('mouseenter', () => focusSeries(series));
  item.addEventListener('mouseleave', () => focusSeries(lockedSeries));
  item.addEventListener('click', () => {
    lockedSeries = lockedSeries === series ? null : series;
    legendItems.forEach(other => other.setAttribute('aria-pressed', String(other.dataset.series === lockedSeries)));
    focusSeries(lockedSeries);
  });
});
realWorld.querySelectorAll('.c-bar').forEach(bar => {
  bar.addEventListener('mouseenter', () => focusSeries(bar.dataset.series));
  bar.addEventListener('mouseleave', () => focusSeries(lockedSeries));
});

// RoboTwin table: click a numeric header to sort (best first, then ascending, then original order).
const resultsTable = document.querySelector('#results table');
if (resultsTable) {
  const tbody = resultsTable.tBodies[0];
  const originalRows = [...tbody.rows];
  const headers = [...resultsTable.tHead.rows[0].cells];
  const cellValue = (row, col) => parseFloat(row.cells[col].lastChild.textContent);
  let sortCol = null, sortDir = 0;
  const reorder = rows => {
    const before = new Map(originalRows.map(row => [row, row.getBoundingClientRect().top]));
    rows.forEach(row => tbody.append(row));
    resultsTable.classList.toggle('sorted', sortCol !== null);
    if (sortCol === null) delete resultsTable.dataset.sortCol;
    else resultsTable.dataset.sortCol = sortCol;
    if (reduceMotion) return;
    originalRows.forEach(row => {
      const dy = before.get(row) - row.getBoundingClientRect().top;
      row.style.transition = 'none';
      row.style.transform = dy ? `translateY(${dy}px)` : '';
    });
    tbody.getBoundingClientRect();
    originalRows.forEach(row => { row.style.transition = ''; row.style.transform = ''; });
  };
  headers.slice(1).forEach((th, i) => {
    const col = i + 1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sort-button';
    button.append(...th.childNodes);
    const icon = document.createElement('span');
    icon.className = 'sort-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    th.append(button);
    th.setAttribute('aria-sort', 'none');
    button.addEventListener('click', () => {
      sortDir = sortCol !== col ? -1 : sortDir === -1 ? 1 : 0;
      sortCol = sortDir ? col : null;
      headers.slice(1).forEach(other => other.setAttribute('aria-sort', 'none'));
      if (sortDir) th.setAttribute('aria-sort', sortDir < 0 ? 'descending' : 'ascending');
      reorder(sortDir ? [...originalRows].sort((a, b) => (cellValue(a, col) - cellValue(b, col)) * sortDir) : originalRows);
    });
  });
}
