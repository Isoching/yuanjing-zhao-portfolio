/* Interactive layer for the author-provided green methanol systems figure. */
(() => {
  'use strict';
  const root = document.getElementById('methanol-vision');
  if (!root) return;
  const modules = [
    { id: 'wind', name: 'Wind turbines', short: 'Wind power', x: 31, y: 2, w: 50, h: 23,
      description: 'Wind turbines convert wind energy into electricity. Renewable power supports water electrolysis, carbon conversion and other operations across the system.' },
    { id: 'solar', name: 'Solar panels', short: 'Solar power', x: 73, y: 54, w: 23, h: 17,
      description: 'Photovoltaic panels convert sunlight into electricity. Solar power complements wind generation and supplies renewable energy to the integrated network.' },
    { id: 'power', name: 'Power plant', short: 'Power plant', x: 18, y: 54, w: 20, h: 19,
      description: 'The power plant connects electricity generation with carbon capture. In the figure, its flue gas supplies a CO₂ stream to the capture unit.' },
    { id: 'capture', name: 'CO₂ capture from flue gas / DAC', short: 'Flue gas / DAC', x: 33, y: 40, w: 19, h: 15,
      description: 'CO₂ is separated from industrial flue gas or captured directly from ambient air. The recovered carbon supplies downstream conversion and storage pathways.' },
    { id: 'co2', name: 'CO₂ storage', short: 'CO₂ storage', x: 28.5, y: 25, w: 12, h: 14.5,
      description: 'Captured CO₂ is buffered before use. Storage helps coordinate carbon supply with downstream conversion and methanol production.' },
    { id: 'ocean', name: 'CO₂ capture and ocean storage', short: 'Ocean pathway', x: 12, y: 27, w: 16, h: 25,
      description: 'This part of the figure represents an ocean-linked CO₂ capture and storage pathway within the wider carbon-management system.' },
    { id: 'water', name: 'Water electrolyser', short: 'Electrolysis', x: 9, y: 73, w: 25, h: 25,
      description: 'An electrolyser uses electricity to split water into hydrogen and oxygen. Renewable electricity connects hydrogen production with the wind and solar supply.' },
    { id: 'hydrogen', name: 'H₂ storage', short: 'H₂ storage', x: 45, y: 75, w: 19, h: 23,
      description: 'Hydrogen is stored between production and use. It provides an energy buffer and a feedstock for chemical production or fuel-cell electricity generation.' },
    { id: 'synthesis', name: 'eCO₂R / methanol synthesis', short: 'Methanol synthesis', x: 40.5, y: 26, w: 22, h: 15.5,
      description: 'This module connects electrochemical CO₂ reduction (eCO₂R) and methanol synthesis. It links captured carbon with renewable electricity and hydrogen-based chemical production pathways.' },
    { id: 'methanol', name: 'e-Methanol storage', short: 'e-Methanol storage', x: 65, y: 26, w: 14, h: 16,
      description: 'e-Methanol is stored between production and use. Storage buffers changes in renewable-linked production schedules and downstream demand.' },
    { id: 'ai', name: 'AI control system', short: 'AI control', x: 49, y: 49, w: 16, h: 25,
      description: 'AI-assisted monitoring and optimisation coordinate electricity supply, carbon capture, hydrogen production, storage and end-use demand across the system.' },
    { id: 'civil', name: 'Civil applications', short: 'End-use demand', x: 79, y: 32, w: 20, h: 22,
      description: 'Buildings and communities represent downstream demand for electricity and energy services. Their demand connects the integrated supply network with end users.' },
    { id: 'fuel', name: 'Fuel cell station', short: 'Fuel cells', x: 69, y: 74, w: 27, h: 24,
      description: 'Fuel cells convert stored hydrogen into electricity. This pathway can provide flexible power when renewable generation and electricity demand do not coincide.' }
  ];
  const byId = new Map(modules.map((module, index) => [module.id, { ...module, number: index + 1 }]));
  const stage = root.querySelector('.vision-stage');
  const map = root.querySelector('.vision-map');
  const scroll = root.querySelector('.vision-map-scroll');
  const hotspots = root.querySelector('.vision-hotspots');
  const choices = root.querySelector('.vision-modules');
  const definitions = root.querySelector('.vision-definitions');
  const tooltip = root.querySelector('.vision-tooltip');
  const tooltipTitle = root.querySelector('.vision-tooltip-title');
  const tooltipText = root.querySelector('.vision-tooltip-text');
  const detailTitle = document.getElementById('vision-detail-title');
  const detailText = document.getElementById('vision-detail-text');
  const detailNumber = root.querySelector('.vision-detail-number');
  const toggle = document.getElementById('vision-motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'ai';
  let pointerModule = null;
  let paused = false;
  let dismissed = false;

  function highlight(id) {
    root.querySelectorAll('.vision-hotspot').forEach(button => {
      button.classList.toggle('is-highlighted', button.dataset.module === id);
    });
  }
  function select(id) {
    const module = byId.get(id);
    if (!module) return;
    selected = id;
    detailTitle.textContent = module.name;
    detailText.textContent = module.description;
    detailNumber.textContent = String(module.number).padStart(2, '0');
    root.querySelectorAll('[data-module]').forEach(button => {
      const active = button.dataset.module === id;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-selected', active);
    });
    highlight(pointerModule || selected);
  }
  function hideTooltip() {
    tooltip.hidden = true;
    pointerModule = null;
    highlight(selected);
  }
  function positionTooltip(clientX, clientY) {
    const bounds = stage.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const minX = Math.max(8, -bounds.left + 8);
    const maxX = Math.max(minX, Math.min(bounds.width - width - 8, innerWidth - bounds.left - width - 12));
    const minY = Math.max(8, -bounds.top + 12);
    const maxY = Math.max(minY, Math.min(bounds.height - height - 8, innerHeight - bounds.top - height - 12));
    let y = clientY - bounds.top + 20;
    if (y > maxY) y = clientY - bounds.top - height - 16;
    tooltip.style.left = `${Math.max(minX, Math.min(clientX - bounds.left + 20, maxX))}px`;
    tooltip.style.top = `${Math.max(minY, Math.min(y, maxY))}px`;
  }
  function showTooltip(id, x, y) {
    if (dismissed) return;
    const module = byId.get(id);
    pointerModule = id;
    tooltipTitle.textContent = module.name;
    tooltipText.textContent = module.description;
    tooltip.hidden = false;
    highlight(id);
    positionTooltip(x, y);
  }
  modules.forEach((module, index) => {
    const number = String(index + 1).padStart(2, '0');
    const definition = document.createElement('p');
    definition.id = `vision-description-${module.id}`;
    definition.textContent = module.description;
    definitions.append(definition);
    const hotspot = document.createElement('button');
    hotspot.type = 'button';
    hotspot.className = 'vision-hotspot';
    hotspot.dataset.module = module.id;
    hotspot.setAttribute('aria-label', module.name);
    hotspot.setAttribute('aria-describedby', definition.id);
    hotspot.setAttribute('aria-controls', 'vision-detail');
    hotspot.style.cssText = `left:${module.x}%;top:${module.y}%;width:${module.w}%;height:${module.h}%;`;
    const pin = document.createElement('span');
    pin.className = 'vision-pin';
    pin.textContent = number;
    pin.setAttribute('aria-hidden', 'true');
    hotspot.append(pin);
    hotspot.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      dismissed = false;
      showTooltip(module.id, event.clientX, event.clientY);
    });
    hotspot.addEventListener('pointermove', event => {
      if (!tooltip.hidden && pointerModule === module.id) positionTooltip(event.clientX, event.clientY);
    });
    hotspot.addEventListener('pointerleave', () => { dismissed = false; hideTooltip(); });
    hotspot.addEventListener('focus', () => {
      dismissed = false;
      const bounds = hotspot.getBoundingClientRect();
      showTooltip(module.id, bounds.left + bounds.width / 2, bounds.top + Math.min(30, bounds.height / 2));
    });
    hotspot.addEventListener('blur', hideTooltip);
    hotspot.addEventListener('click', () => select(module.id));
    hotspots.append(hotspot);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'vision-module';
    chip.dataset.module = module.id;
    chip.setAttribute('aria-label', module.name);
    chip.setAttribute('aria-describedby', definition.id);
    chip.setAttribute('aria-controls', 'vision-detail');
    const chipNumber = document.createElement('span');
    chipNumber.textContent = number;
    chipNumber.setAttribute('aria-hidden', 'true');
    chip.append(chipNumber, document.createTextNode(module.short));
    chip.addEventListener('click', () => {
      hideTooltip();
      select(module.id);
      scroll.scrollTo({ left: map.clientWidth * (module.x + module.w / 2) / 100 - scroll.clientWidth / 2,
        behavior: reduced.matches ? 'auto' : 'smooth' });
    });
    choices.append(chip);
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { dismissed = true; hideTooltip(); }
  });
  scroll.addEventListener('scroll', hideTooltip, { passive: true });
  addEventListener('scroll', hideTooltip, { passive: true });
  addEventListener('resize', hideTooltip, { passive: true });
  function updateMotion() {
    const stopped = paused || reduced.matches;
    map.dataset.motion = stopped ? 'paused' : 'playing';
    toggle.textContent = reduced.matches ? 'Reduced motion' : stopped ? 'Play motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.disabled = reduced.matches;
  }
  toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', updateMotion);
  select(selected);
  if (scroll.clientWidth < map.clientWidth) scroll.scrollLeft = map.clientWidth * .57 - scroll.clientWidth / 2;
  updateMotion();
})();
