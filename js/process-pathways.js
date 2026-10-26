/* Animate the actual review figure supplied in save1.png.pdf. */
(() => {
  'use strict';
  const root = document.getElementById('process-explorer');
  if (!root) return;
  const routes = window.PORTFOLIO.routes;
  const map = root.querySelector('.route-paper-map');
  const scroll = root.querySelector('.route-graphic');
  const stage = root.querySelector('.route-body');
  const overlay = root.querySelector('.route-paper-animation');
  const hotspots = root.querySelector('.route-paper-hotspots');
  const choices = root.querySelector('.route-unit-list');
  const toggle = document.getElementById('route-motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedRoute = 'two';
  let selectedNode = 0;
  let paused = false;
  let dismissed = false;
  const tooltip = document.createElement('div');
  tooltip.className = 'vision-tooltip route-paper-tooltip';
  tooltip.id = 'route-unit-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  const tooltipTitle = document.createElement('strong');
  tooltipTitle.className = 'vision-tooltip-title';
  const tooltipText = document.createElement('p');
  tooltipText.className = 'vision-tooltip-text';
  tooltip.append(tooltipTitle, tooltipText);
  stage.append(tooltip);

  Object.entries(routes).forEach(([key, route]) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.dataset.routeFlow = key;
    group.classList.add('route-flow-group');
    route.flows.forEach((d, index) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.classList.add('route-paper-flow');
      path.setAttribute('d', d);
      path.style.animationDelay = `${index * -.23}s`;
      group.append(path);
    });
    overlay.append(group);
  });

  function hideTooltip() { tooltip.hidden = true; }
  function showTooltip(index, clientX, clientY) {
    if (dismissed) return;
    const node = routes[selectedRoute].nodes[index];
    tooltipTitle.textContent = node.name;
    tooltipText.textContent = node.text;
    tooltip.hidden = false;
    const bounds = stage.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const minX = Math.max(8, 8 - bounds.left);
    const maxX = Math.max(minX, Math.min(bounds.width - width - 8, innerWidth - bounds.left - width - 12));
    const minY = Math.max(8, 12 - bounds.top);
    const maxY = Math.max(minY, Math.min(bounds.height - height - 8, innerHeight - bounds.top - height - 12));
    let y = clientY - bounds.top + 18;
    if (y > maxY) y = clientY - bounds.top - height - 16;
    tooltip.style.left = `${Math.max(minX, Math.min(clientX - bounds.left + 18, maxX))}px`;
    tooltip.style.top = `${Math.max(minY, Math.min(y, maxY))}px`;
  }
  function chooseNode(index, pan = false) {
    const node = routes[selectedRoute].nodes[index];
    if (!node) return;
    selectedNode = index;
    document.getElementById('route-detail-number').textContent = String(index + 1).padStart(2, '0');
    document.getElementById('route-detail-title').textContent = node.name;
    document.getElementById('route-detail-text').textContent = node.text;
    root.querySelectorAll('[data-node]').forEach(button => {
      const selected = Number(button.dataset.node) === index;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (pan) scroll.scrollTo({left: map.clientWidth * (node.rect[0] + node.rect[2] / 2) / 1263 - scroll.clientWidth / 2, behavior: reduced.matches ? 'auto' : 'smooth'});
  }
  function renderRoute(key) {
    if (!routes[key]) return;
    selectedRoute = key;
    selectedNode = 0;
    hideTooltip();
    dismissed = false;
    const route = routes[key];
    map.dataset.route = key;
    document.getElementById('route-selected-title').textContent = route.label;
    document.getElementById('route-note').textContent = route.note;
    root.querySelectorAll('[data-route]').forEach(button => {
      const selected = button.dataset.route === key;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    overlay.querySelectorAll('[data-route-flow]').forEach(group => group.classList.toggle('is-active', group.dataset.routeFlow === key));
    hotspots.replaceChildren();
    choices.replaceChildren();
    route.nodes.forEach((node, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'route-paper-unit';
      button.dataset.node = index;
      button.setAttribute('aria-label', node.name);
      button.setAttribute('aria-controls', 'route-detail');
      button.setAttribute('aria-describedby', 'route-unit-tooltip');
      const [x, y, w, h] = node.rect;
      button.style.cssText = `left:${x / 1263 * 100}%;top:${y / 892.5 * 100}%;width:${w / 1263 * 100}%;height:${h / 892.5 * 100}%;`;
      button.addEventListener('click', () => chooseNode(index));
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        dismissed = false;
        showTooltip(index, event.clientX, event.clientY);
      });
      button.addEventListener('pointermove', event => {
        if (!tooltip.hidden) showTooltip(index, event.clientX, event.clientY);
      });
      button.addEventListener('pointerleave', hideTooltip);
      button.addEventListener('focus', () => {
        dismissed = false;
        const bounds = button.getBoundingClientRect();
        showTooltip(index, bounds.left + bounds.width / 2, bounds.top + 20);
      });
      button.addEventListener('blur', hideTooltip);
      button.addEventListener('keydown', event => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = (index + step + route.nodes.length) % route.nodes.length;
        chooseNode(next);
        hotspots.children[next].focus();
      });
      hotspots.append(button);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'route-unit-choice';
      chip.dataset.node = index;
      chip.textContent = `${String(index + 1).padStart(2, '0')} · ${node.name}`;
      chip.setAttribute('aria-controls', 'route-detail');
      chip.addEventListener('click', () => { hideTooltip(); chooseNode(index, true); });
      choices.append(chip);
    });
    chooseNode(selectedNode);
  }
  function updateMotion() {
    const stopped = paused || reduced.matches;
    map.dataset.motion = stopped ? 'paused' : 'playing';
    toggle.textContent = reduced.matches ? 'Reduced motion' : stopped ? 'Play motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.disabled = reduced.matches;
  }
  function handleViewportChange() {
    const focused = hotspots.querySelector(':focus');
    if (focused && !dismissed) {
      const bounds = focused.getBoundingClientRect();
      showTooltip(Number(focused.dataset.node), bounds.left + bounds.width / 2, bounds.top + 20);
    } else hideTooltip();
  }
  root.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => renderRoute(button.dataset.route)));
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { dismissed = true; hideTooltip(); } });
  scroll.addEventListener('scroll', handleViewportChange, {passive:true});
  addEventListener('scroll', handleViewportChange, {passive:true});
  addEventListener('resize', handleViewportChange, {passive:true});
  toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', updateMotion);
  renderRoute('two');
  updateMotion();
})();
