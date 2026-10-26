/* Focus one original review route while retaining the full comparison figure. */
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
  const toggle = document.getElementById('route-motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.getElementById('route-selection-status');
  const svgNS = 'http://www.w3.org/2000/svg';
  let selectedRoute = null;
  let paused = false;
  let dismissed = false;
  let visibleNodes = [];
  const makeSVG = (tag, attributes = {}) => {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  };

  const defs = makeSVG('defs');
  const feather = makeSVG('filter', {id: 'route-focus-feather', x: '-10%', y: '-10%', width: '120%', height: '120%'});
  feather.append(makeSVG('feGaussianBlur', {stdDeviation: '3'}));
  defs.append(feather);
  const focusMask = makeSVG('mask', {id: 'route-focus-mask', maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '1263', height: '892.5'});
  focusMask.append(makeSVG('rect', {width: '1263', height: '892.5', fill: 'black'}));
  defs.append(focusMask);
  overlay.append(defs);
  const focusImage = makeSVG('image', {href: 'assets/methanol-pathways-review.png', width: '1263', height: '892.5', mask: 'url(#route-focus-mask)', class: 'route-focus-image'});
  overlay.append(focusImage);
  const flowLayer = makeSVG('g', {class: 'route-flow-layer'});
  overlay.append(flowLayer);
  Object.entries(routes).forEach(([key, route]) => {
    const region = makeSVG('g', {class: 'route-focus-region', 'data-route-focus': key, fill: 'white', filter: 'url(#route-focus-feather)'});
    route.focusRegions.forEach(([x, y, width, height]) => region.append(makeSVG('rect', {x, y, width, height, rx: '8'})));
    focusMask.append(region);
    const group = makeSVG('g', {class: 'route-flow-group', 'data-route-flow': key});
    route.flows.forEach((d, index) => {
      const path = makeSVG('path', {class: 'route-paper-flow', d});
      path.style.animationDelay = `${index * -.23}s`;
      group.append(path);
    });
    flowLayer.append(group);
  });

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
  function hideTooltip() { tooltip.hidden = true; }
  function showTooltip(node, clientX, clientY) {
    if (dismissed || !node) return;
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
  function showAtButton(node, button) {
    const bounds = button.getBoundingClientRect();
    showTooltip(node, bounds.left + bounds.width / 2, bounds.top + 20);
  }
  function renderHotspots() {
    const nodes = selectedRoute ? routes[selectedRoute].nodes : Object.values(routes).flatMap(route => route.nodes);
    const seen = new Set();
    visibleNodes = nodes.filter(node => {
      const signature = `${node.name}:${node.rect.join(',')}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
    hotspots.replaceChildren();
    visibleNodes.forEach((node, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'route-paper-unit';
      button.dataset.unit = index;
      button.setAttribute('aria-label', node.name);
      button.setAttribute('aria-describedby', 'route-unit-tooltip');
      const [x, y, width, height] = node.rect;
      button.style.cssText = `left:${x / 1263 * 100}%;top:${y / 892.5 * 100}%;width:${width / 1263 * 100}%;height:${height / 892.5 * 100}%;`;
      button.addEventListener('click', () => { dismissed = false; showAtButton(node, button); });
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        dismissed = false;
        showTooltip(node, event.clientX, event.clientY);
      });
      button.addEventListener('pointermove', event => { if (!tooltip.hidden) showTooltip(node, event.clientX, event.clientY); });
      button.addEventListener('pointerleave', hideTooltip);
      button.addEventListener('focus', () => { dismissed = false; showAtButton(node, button); });
      button.addEventListener('blur', hideTooltip);
      button.addEventListener('keydown', event => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        hotspots.children[(index + step + visibleNodes.length) % visibleNodes.length].focus();
      });
      hotspots.append(button);
    });
  }
  function renderRoute(key, pan = false) {
    if (key && !routes[key]) return;
    selectedRoute = key || null;
    hideTooltip();
    dismissed = false;
    map.dataset.route = selectedRoute || 'all';
    map.classList.toggle('has-focused-route', !!selectedRoute);
    status.textContent = selectedRoute ? `${routes[selectedRoute].label} is highlighted; the other three routes are dimmed.` : 'All four routes are shown.';
    root.querySelectorAll('.route-switch [data-route]').forEach(button => {
      const active = button.dataset.route === selectedRoute;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    focusMask.querySelectorAll('[data-route-focus]').forEach(group => group.classList.toggle('is-active', group.dataset.routeFocus === selectedRoute));
    flowLayer.querySelectorAll('[data-route-flow]').forEach(group => group.classList.toggle('is-active', !selectedRoute || group.dataset.routeFlow === selectedRoute));
    if (selectedRoute) flowLayer.setAttribute('mask', 'url(#route-focus-mask)');
    else flowLayer.removeAttribute('mask');
    renderHotspots();
    if (pan && scroll.clientWidth < map.clientWidth) {
      const region = selectedRoute && routes[selectedRoute].focusRegions[0];
      const left = region ? map.clientWidth * (region[0] + region[2] / 2) / 1263 - scroll.clientWidth / 2 : 0;
      scroll.scrollTo({left, behavior: reduced.matches ? 'auto' : 'smooth'});
    }
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
    if (focused && !dismissed) showAtButton(visibleNodes[Number(focused.dataset.unit)], focused);
    else hideTooltip();
  }
  root.querySelectorAll('.route-switch [data-route]').forEach(button => button.addEventListener('click', () => renderRoute(button.dataset.route === selectedRoute ? null : button.dataset.route, true)));
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!tooltip.hidden) { dismissed = true; hideTooltip(); }
    else renderRoute(null);
  });
  scroll.addEventListener('scroll', handleViewportChange, {passive:true});
  addEventListener('scroll', handleViewportChange, {passive:true});
  addEventListener('resize', handleViewportChange, {passive:true});
  toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', updateMotion);
  renderRoute(null);
  updateMotion();
})();
