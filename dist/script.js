'use strict';

const dialog = document.querySelector('#media-dialog');
const dialogContent = document.querySelector('#dialog-content');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCaption = document.querySelector('#dialog-caption');
let lastFocused = null;
let results = null;

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
document.querySelectorAll('.video-wrap video').forEach(video => {
  monitorVideo(video);
  const play = document.createElement('button');
  play.className = 'play-demo';
  play.setAttribute('aria-label', `Play ${video.id.split('-')[0]} highlight video`);
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6z"/></svg>';
  video.controls = false;
  play.addEventListener('click', async () => {
    video.controls = true;
    play.hidden = true;
    try { await video.play(); }
    catch { play.hidden = false; notify('Press play again, or open the complete video.'); }
  });
  video.parentElement.append(play);
});

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
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseVideos(); });

function activate(button, selector) {
  document.querySelectorAll(selector).forEach(item => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
}

document.querySelectorAll('[data-setting]').forEach(button => {
  button.addEventListener('click', () => {
    if (!results) return notify('Results are still loading. Please try again.');
    activate(button, '[data-setting]');
    const setting = button.dataset.setting;
    const methods = ['Fast-WAM', 'LingBot-VA 2.0', 'LAW + Fast-WAM'];
    document.querySelectorAll('#robotwin-bars .bar-row').forEach((row, index) => {
      const record = results.robotwin.find(item => item.method === methods[index]);
      const value = record[setting];
      row.querySelector('i').style.width = `${value}%`;
      row.querySelector('strong').textContent = index === 2 ? Number(value).toFixed(2) : Number(value).toFixed(1);
    });
  });
});

document.querySelectorAll('[data-metric]').forEach(button => {
  button.addEventListener('click', () => {
    if (!results) return notify('Results are still loading. Please try again.');
    activate(button, '[data-metric]');
    const metric = button.dataset.metric;
    const real = results.realWorld;
    const values = [...real.tasks.map(task => task[metric]), metric === 'success_rate' ? real.meanSuccess : real.meanScore];
    const format = value => metric === 'task_score' ? Number(value).toFixed(2) : String(value);
    document.querySelectorAll('.bar-group').forEach((group, groupIndex) => {
      group.querySelectorAll('.column').forEach((column, methodIndex) => {
        const value = values[groupIndex][methodIndex];
        column.style.height = `${value}%`;
        column.querySelector('span').textContent = format(value);
      });
    });
    const title = metric === 'success_rate' ? 'Complete-task success rate (%)' : 'Task score (0–100)';
    const table = document.querySelector('#real-results-table');
    table.querySelector('caption').textContent = title;
    table.querySelectorAll('tbody tr').forEach((row, methodIndex) => {
      row.querySelectorAll('td').forEach((cell, taskIndex) => { cell.textContent = format(values[taskIndex][methodIndex]); });
    });
    document.querySelector('#real-chart').setAttribute('aria-label', `${title}. ${real.methods.map((method, index) => `${method}: ${values.map(row => format(row[index])).join(', ')} for Puzzle, Domino, Organize, and average.`).join(' ')}`);
    document.querySelector('#metric-note').textContent = metric === 'success_rate'
      ? 'Success rate (%) measures episodes that complete the entire task. Task score (0–100) measures the fraction of semantic stages completed.'
      : 'Task score gives equal credit to completed semantic stages, normalized to 0–100 within each task. It is distinct from complete-task success rate.';
  });
});

document.querySelectorAll('[data-example]').forEach(button => {
  button.addEventListener('click', () => {
    activate(button, '[data-example]');
    const roboTwin = button.dataset.example === 'robotwin';
    const path = `assets/images/${roboTwin ? 'robotwin' : 'robodojo'}-subtasks.jpg`;
    const caption = `${roboTwin ? 'RoboTwin' : 'RoboDojo'} demonstrations decomposed into semantic subtasks.`;
    const image = document.querySelector('#semantic-image');
    image.src = path;
    image.alt = caption;
    image.height = roboTwin ? 1116 : 1126;
    document.querySelector('#semantic-zoom').dataset.image = path;
    document.querySelector('#semantic-zoom').dataset.caption = caption;
    document.querySelector('#example-description').textContent = roboTwin
      ? 'Semantic boundaries and subtask descriptions in RoboTwin demonstrations.'
      : 'Semantic stages in RoboDojo, spanning manipulation and interaction tasks.';
  });
});

fetch('assets/data/results.json').then(response => {
  if (!response.ok) throw new Error(`Results request failed: ${response.status}`);
  return response.json();
}).then(data => { results = data; }).catch(() => {
  document.querySelectorAll('[data-setting], [data-metric]').forEach(button => { button.disabled = true; });
  notify('The interactive results could not load. The reported default values and paper remain available.');
});
