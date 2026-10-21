'use strict';

const dialog = document.querySelector('#media-dialog');
const dialogContent = document.querySelector('#dialog-content');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCaption = document.querySelector('#dialog-caption');
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
    dialogContent.append(img);
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
let heroPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let heroVisible = true;
function syncHeroPlayback() {
  const foregroundPlaying = [...document.querySelectorAll('video:not(.hero-video)')].some(video => !video.paused);
  const play = !heroPaused && heroVisible && !document.hidden && !dialog.open && !foregroundPlaying;
  heroVideos.forEach(video => {
    video.muted = true;
    if (play) video.play().catch(() => {});
    else video.pause();
  });
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
const syncHeader = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', syncHeader, { passive: true });
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
