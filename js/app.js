/* Portfolio interface: native HTML, CSS and JavaScript, including file:// support. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const content = window.PORTFOLIO;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* File previews may restrict storage. */ } }
  };
  let toastTimer;
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3600); }
  function downloadText(text, filename, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], {type});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  async function copyText(text, message = 'Copied to clipboard.') {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); toast(message); return true; }
    } catch (_) { /* Fall through to the local-file-compatible copy method. */ }
    const node=document.createElement('textarea');node.value=text;node.setAttribute('readonly','');node.style.cssText='position:fixed;left:-9999px;top:0';
    const owner=document.querySelector('dialog[open]') || document.body;
    const previousFocus=document.activeElement;owner.appendChild(node);node.select();
    let copied=false;try{copied=document.execCommand('copy');}catch(_){copied=false;}
    node.remove();previousFocus?.focus({preventScroll:true});
    toast(copied ? message : 'Automatic copying was blocked. Select the text and copy it manually.');return copied;
  }

  // Public account links follow the Surrey profile; optional downloads stay hidden until supplied.
  all('[data-profile-link]').forEach(a=>{const value=content.links[a.dataset.profileLink];if(value)a.href=value;});
  $('contact-email').href=`mailto:${content.email}`;
  $('contact-email').firstChild.textContent=content.email+' ';
  ['github','linkedin'].forEach(key=>{const a=$(key+'-link');if(a&&content.links[key]){a.href=content.links[key];a.hidden=false;}});
  if(content.links.cv){$('cv-link').href=content.links.cv;$('cv-link').target='_blank';$('cv-link').rel='noopener noreferrer';$('cv-link').hidden=false;}
  $('copy-email').addEventListener('click',()=>copyText(content.email,'Email address copied.'));

  // Colour and motion settings remain on this device. There is no analytics.
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const savedTheme=storage.get('yz-theme');
  document.documentElement.dataset.theme=savedTheme==='dusk'?'dusk':'day';
  const hero=new window.PortfolioViz.MoleculeView($('molecule-canvas'));
  let chart;
  function updateThemeButton(){const dusk=document.documentElement.dataset.theme==='dusk';$('theme-toggle').setAttribute('aria-label',dusk?'Switch to daylight theme':'Switch to dusk theme');$('theme-toggle').title=dusk?'Switch to daylight':'Switch to dusk';}
  function toggleTheme(){const next=document.documentElement.dataset.theme==='dusk'?'day':'dusk';document.documentElement.dataset.theme=next;storage.set('yz-theme',next);updateThemeButton();hero.draw();chart?.draw();document.querySelector('meta[name="theme-color"]').content=next==='dusk'?'#202b26':'#f5f4ef';}
  updateThemeButton();$('theme-toggle').addEventListener('click',toggleTheme);
  function setMotion(value,persist=true){hero.setRunning(value);document.body.classList.toggle('motion-paused',!value);$('motion-toggle').setAttribute('aria-pressed',String(!value));$('motion-toggle').setAttribute('aria-label',value?'Pause animated molecule':'Play animated molecule');$('motion-toggle').querySelector('.motion-label').textContent=value?'Pause motion':'Play motion';$('motion-toggle').querySelector('.pause-icon').textContent=value?'Ⅱ':'▷';if(persist)storage.set('yz-motion',value?'on':'off');}
  setMotion(!reducedMotion.matches&&storage.get('yz-motion')!=='off',false);
  $('motion-toggle').addEventListener('click',()=>setMotion(!hero.running));
  reducedMotion.addEventListener('change',e=>{if(e.matches)setMotion(false,false);});

  // Navigation.
  $('menu-toggle').addEventListener('click',()=>{const open=$('menu-toggle').getAttribute('aria-expanded')==='true';$('menu-toggle').setAttribute('aria-expanded',String(!open));$('menu-toggle').setAttribute('aria-label',open?'Open navigation':'Close navigation');$('mobile-nav').hidden=open;});
  all('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('mobile-nav').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').setAttribute('aria-label','Open navigation');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mobile-nav').hidden){$('mobile-nav').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').setAttribute('aria-label','Open navigation');$('menu-toggle').focus();}});
  const navLinks=all('.desktop-nav a'), sectionIDs=['research','playground','publications','about','teaching'];let scrollPending=false;
  function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.reading-progress').style.width=(max>0?scrollY/max*100:0)+'%';let active='';sectionIDs.forEach(id=>{if($(id).getBoundingClientRect().top<=180)active=id;});navLinks.forEach(a=>{const current=a.getAttribute('href')==='#'+active;a.classList.toggle('is-current',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scrollPending=false;}
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();
  if('IntersectionObserver'in window&&!reducedMotion.matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('is-pending');observer.unobserve(entry.target);}}),{threshold:.08});all('.section-heading,.research-card,.about-copy').forEach(el=>{el.classList.add('reveal','is-pending');observer.observe(el);});}

  // Native dialogs retain focus trapping and Escape behaviour.
  const detail=$('detail-dialog'),command=$('command-dialog');
  [detail,command].forEach(dialog=>{
    dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  });
  function openDialog(dialog){[detail,command].forEach(d=>{if(d!==dialog&&d.open)d.close();});document.body.style.overflow='hidden';if(!dialog.open)dialog.showModal();}
  detail.querySelector('.dialog-close').addEventListener('click',()=>detail.close());
  command.querySelector('.command-close').addEventListener('click',()=>command.close());
  function showProject(id){const p=content.projects.find(p=>p.id===id);if(!p)return;
    $('detail-dialog-eyebrow').textContent=`RESEARCH NOTE ${p.number} / ${p.category}`;
    $('detail-dialog-body').innerHTML=`<span class="dialog-status">${escapeHTML(p.status)}</span><h2 id="detail-dialog-title">${escapeHTML(p.title)}</h2><p>${escapeHTML(p.overview)}</p><div class="project-question">${escapeHTML(p.question)}</div><h3>Methods & perspective</h3><div class="dialog-tags">${p.methods.map(m=>`<span>${escapeHTML(m)}</span>`).join('')}</div><a class="button button-primary project-detail-link" href="${escapeHTML(p.link)}" ${p.link.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}>${escapeHTML(p.linkText)} <span aria-hidden="true">↗</span></a><p class="dialog-source">Research context: <a href="${escapeHTML(p.source)}" target="_blank" rel="noopener noreferrer">University of Surrey profile</a>. The complete publication and manuscript list from that profile appears in the publications section.</p>`;
    detail.querySelector('.project-detail-link')?.addEventListener('click',()=>{if(p.link.startsWith('#'))detail.close();});openDialog(detail);
  }
  all('[data-project]').forEach(button=>button.addEventListener('click',()=>showProject(button.dataset.project)));

  // Pathway explorer. This is a schematic; no flows, performance values or balances are implied.
  let activeRoute='two',activeNode=0;
  function chooseNode(index){const route=content.routes[activeRoute];if(index<0||index>=route.nodes.length)return;activeNode=index;
    $('route-detail-number').textContent=String(index+1).padStart(2,'0');$('route-detail-title').textContent=route.nodes[index].name;$('route-detail-text').textContent=route.nodes[index].text;
    all('#route-svg .route-node').forEach((n,i)=>{n.classList.toggle('is-active',i===index);n.setAttribute('aria-pressed',String(i===index));});
  }
  function renderRoute(key){activeRoute=key;activeNode=0;const route=content.routes[key],xs=[18,242,466,690],nodeWidth=174,y=109,midY=147;
    const auxIndex=key==='conventional'?1:2,auxX=xs[auxIndex]+nodeWidth/2;
    let markup=`<title>${escapeHTML(route.label)}</title><defs><marker id="route-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="var(--accent)"/></marker></defs>`;
    markup+=`<rect x="${auxX-153}" y="26" width="306" height="29" rx="3" fill="var(--sage)"/><text class="route-aux" x="${auxX}" y="44">${escapeHTML(route.auxiliary)}</text><path class="route-connector route-animated" d="M${auxX} 55V104" marker-end="url(#route-arrow)"/>`;
    xs.forEach((x,i)=>{const n=route.nodes[i];if(i<3)markup+=`<path class="route-connector route-animated" d="M${x+nodeWidth} ${midY}H${xs[i+1]-7}" marker-end="url(#route-arrow)"/>`;markup+=`<g class="route-node${i===0?' is-active':''}" data-node="${i}" role="button" tabindex="0" aria-label="${escapeHTML(n.name)}: show process explanation" aria-pressed="${i===0}"><rect x="${x}" y="${y}" width="${nodeWidth}" height="76" rx="3"/><text class="node-no" x="${x+14}" y="${y+19}">0${i+1}</text><text class="node-name" text-anchor="middle" x="${x+nodeWidth/2}" y="${y+42}">${escapeHTML(n.name)}</text><text class="node-sub" text-anchor="middle" x="${x+nodeWidth/2}" y="${y+59}">${escapeHTML(n.sub)}</text></g>`;});
    markup+=`<path class="route-connector route-animated" d="M864 ${midY}H904" marker-end="url(#route-arrow)"/><text class="route-product" x="941" y="152">CH₃OH</text><text class="route-aux" x="941" y="172" style="font-size:7px">METHANOL</text>`;
    $('route-svg').innerHTML=markup;$('route-note').textContent=route.note+' Select a unit to explore its role.';
    all('[data-route]').forEach(b=>{const selected=b.dataset.route===key;b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));});chooseNode(0);
  }
  $('route-svg').addEventListener('click',e=>{const target=e.target.closest('[data-node]');if(target)chooseNode(Number(target.dataset.node));});
  $('route-svg').addEventListener('keydown',e=>{const target=e.target.closest('[data-node]');if(!target)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseNode(Number(target.dataset.node));}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=(Number(target.dataset.node)+(e.key==='ArrowRight'?1:3))%4;chooseNode(next);all('#route-svg [data-node]')[next].focus();}});
  all('[data-route]').forEach(b=>b.addEventListener('click',()=>renderRoute(b.dataset.route)));renderRoute('two');

  // Working TOPSIS explorer.
  const demoData=window.PortfolioViz.makeDemoData();let result,inspectedId=null;
  const weightInputs=[$('weight-carbon'),$('weight-energy'),$('weight-cost')];
  const weightOutputs=[$('weight-carbon-label'),$('weight-energy-label'),$('weight-cost-label')];
  chart=new window.PortfolioViz.ParetoView($('pareto-canvas'),demoData,id=>{inspectedId=id;renderSelection();});
  $('design-count').textContent=String(demoData.length);
  function roundedPercentages(weights){const exact=weights.map(w=>w*100),values=exact.map(Math.floor);let remainder=100-values.reduce((a,b)=>a+b,0);const order=exact.map((v,i)=>({i,f:v-values[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);for(let i=0;i<remainder;i++)values[order[i].i]++;return values;}
  function renderSelection(){const point=result.ranked.find(p=>p.id===inspectedId)||result.best;
    $('recommendation-caption').textContent=point.id===result.best.id?'TOPSIS COMPROMISE':'INSPECTED DESIGN';$('recommendation-id').textContent=point.id;
    $('result-carbon').textContent=point.carbon.toFixed(1);$('result-energy').textContent=point.energy.toFixed(1);$('result-cost').textContent=point.cost.toFixed(1);$('closeness-score').textContent=point.score.toFixed(3);
    $('return-recommended').hidden=point.id===result.best.id;chart.setSelection(result.best.id,point.id);
  }
  function renderTable(){ $('design-table-body').innerHTML=result.ranked.map(p=>`<tr${p.id===result.best.id?' class="is-best"':''}><td>${p.rank}</td><td><button class="table-design-button" data-design="${p.id}" aria-label="Inspect design ${p.id}" style="padding:0;text-decoration:underline;text-underline-offset:3px">${p.id}</button></td><td>${p.carbon.toFixed(2)}</td><td>${p.energy.toFixed(2)}</td><td>${p.cost.toFixed(2)}</td><td>${p.score.toFixed(4)}</td></tr>`).join(''); }
  function updateWeights({notify=false}={}){result=window.PortfolioViz.rankTOPSIS(demoData,weightInputs.map(i=>Number(i.value)));const percentages=roundedPercentages(result.weights);
    weightInputs.forEach((input,i)=>{weightOutputs[i].textContent=percentages[i]+'%';input.style.setProperty('--range-pct',input.value+'%');input.setAttribute('aria-valuetext',`Relative preference ${input.value}; normalised weight ${percentages[i]} per cent`);});
    inspectedId=null;renderSelection();renderTable();if(result.zeroFallback&&notify)toast('All priorities are zero: equal weights are used.');
  }
  weightInputs.forEach(input=>input.addEventListener('input',()=>{all('[data-preset]').forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});updateWeights({notify:true});}));
  const presets={balanced:[50,50,50],carbon:[90,10,10],cost:[10,20,90]};
  function applyPreset(key){if(!presets[key])return;weightInputs.forEach((input,i)=>{input.value=String(presets[key][i]);});all('[data-preset]').forEach(b=>{const active=b.dataset.preset===key;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});updateWeights();}
  all('[data-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
  $('return-recommended').addEventListener('click',()=>{inspectedId=null;renderSelection();});
  $('design-table-body').addEventListener('click',e=>{const b=e.target.closest('[data-design]');if(b){inspectedId=b.dataset.design;renderSelection();}});
  all('[data-view]').forEach(b=>b.addEventListener('click',()=>{chart.setView(b.dataset.view);all('[data-view]').forEach(other=>{const selected=other===b;other.classList.toggle('is-active',selected);other.setAttribute('aria-pressed',String(selected));});$('plot-interaction-label').textContent=b.dataset.view==='3d'?'DRAG TO ROTATE · CLICK TO INSPECT':'CLICK TO INSPECT · SIZE = CAPITAL';}));
  $('reset-view').addEventListener('click',()=>{chart.reset();toast('Chart view reset.');});
  $('download-data').addEventListener('click',()=>{const header='dataset_type,design_id,carbon_utilisation_benefit_index,electricity_cost_index,capital_cost_index,weight_carbon,weight_electricity,weight_capital,topsis_closeness,topsis_rank';const lines=result.ranked.map(p=>['synthetic_illustration',p.id,p.carbon.toFixed(10),p.energy.toFixed(10),p.cost.toFixed(10),...result.weights.map(w=>w.toFixed(12)),p.score.toFixed(12),p.rank].join(','));downloadText([header,...lines].join('\r\n'),'illustrative-topsis-designs.csv','text/csv;charset=utf-8');toast('Example data exported — all values are synthetic.');});
  updateWeights();
  // Read-only hooks make independent testing and later data replacement straightforward.
  window.PORTFOLIO_DEMO={data:demoData,get result(){return result;},get view(){return chart.view;},get inspectedId(){return inspectedId;}};

  // Publications and citation tools.
  function renderPublications(filter='all'){const papers=content.publications.filter(p=>filter==='all'||p.status===filter);
    $('publication-list').innerHTML=papers.map(p=>{
      const review=p.status==='under-review';
      const linkLabel=review?'Surrey listing':p.type==='conference'?'Conference book':'Read paper';
      const venue=review?'Submitted to '+p.journal+' · Under review':p.journal;
      return `<article class="publication-row${review?' is-under-review':''}" data-publication="${escapeHTML(p.id)}"><div class="publication-year">${p.year||'—'}<span class="publication-type">${escapeHTML(p.label)}</span></div><div class="publication-body"><h3>${review?escapeHTML(p.title):`<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.title)}</a>`}</h3><p class="publication-authors">${escapeHTML(p.authors)}</p><p class="publication-journal">${escapeHTML(venue)}</p>${p.note?`<p class="publication-note">${escapeHTML(p.note)}</p>`:''}</div><div class="publication-actions"><a href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(linkLabel+': '+p.title)}">${linkLabel} ↗</a><button data-cite="${escapeHTML(p.id)}" aria-label="Cite ${escapeHTML(p.title)}">Cite ⧉</button></div></article>`;
    }).join('');
    $('publication-count').textContent=`${papers.length} ${papers.length===1?'RECORD':'RECORDS'}`;
    all('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  }
  all('[data-filter]').forEach(b=>b.addEventListener('click',()=>renderPublications(b.dataset.filter)));renderPublications();
  function showCitation(id){const p=content.publications.find(p=>p.id===id);if(!p)return;let format='plain';
    const plain=p.citation;
    $('detail-dialog-eyebrow').textContent='REFERENCE TOOLS / '+(p.year||'UNDER REVIEW');
    $('detail-dialog-body').innerHTML=`<h2 id="detail-dialog-title">Take the reference<br>with you.</h2><p>${escapeHTML(p.journal)}</p><div class="citation-tabs" role="group" aria-label="Citation format"><button data-format="plain" class="is-active" aria-pressed="true">Plain text</button><button data-format="bibtex" aria-pressed="false">BibTeX</button></div><pre class="citation-text" id="citation-text"></pre><div class="citation-actions"><button class="button button-primary" id="copy-citation">Copy citation <span aria-hidden="true">⧉</span></button><button class="button" id="download-citation">Download .bib <span aria-hidden="true">↓</span></button></div>`;
    $('citation-text').textContent=plain;
    detail.querySelectorAll('[data-format]').forEach(b=>b.addEventListener('click',()=>{format=b.dataset.format;$('citation-text').textContent=format==='bibtex'?p.bibtex:plain;detail.querySelectorAll('[data-format]').forEach(other=>{other.classList.toggle('is-active',other===b);other.setAttribute('aria-pressed',String(other===b));});}));
    $('copy-citation').addEventListener('click',()=>copyText(format==='bibtex'?p.bibtex:plain,'Citation copied.'));
    $('download-citation').addEventListener('click',()=>downloadText(p.bibtex+'\n',p.id+'.bib','application/x-bibtex;charset=utf-8'));openDialog(detail);
  }
  $('publication-list').addEventListener('click',e=>{const b=e.target.closest('[data-cite]');if(b)showCitation(b.dataset.cite);});
  $('prototype-info').addEventListener('click',()=>{
    $('detail-dialog-eyebrow').textContent='PROFILE / CONTENT & SOURCES';
    $('detail-dialog-body').innerHTML='<h2 id="detail-dialog-title">Profile &amp; sources.</h2><p>This portfolio reproduces the personal profile information listed on the University of Surrey page, captured on 26 October 2026: biography, qualifications, memberships, departments, research, teaching, sustainable development goals, contact information, account links and all 11 publication and manuscript records.</p><p>Publication and review status follow that source. Manuscripts marked under review are not presented as accepted publications. Years not provided by the source remain unspecified. The profile photograph and CV were supplied by Yuanjing Zhao. The SDG images are the same original assets displayed on the Surrey profile.</p><h3>The interactive playground</h3><p>The methanol geometry and process pathways are illustrations. All 91 design points and their objective indices are synthetic. TOPSIS is computed locally from the displayed preferences; this demonstration does not reproduce research results.</p><h3>Privacy &amp; accessibility</h3><p>No analytics, tracking cookies, external fonts or third-party scripts are used. Theme and motion preferences are stored in your browser. The page supports keyboard navigation, reduced motion and small screens.</p><p class="dialog-source">Source: <a href="https://www.surrey.ac.uk/people/yuanjing-jason-zhao" target="_blank" rel="noopener noreferrer">Yuanjing (Jason) Zhao · University of Surrey ↗</a></p>';
    openDialog(detail);
  });

  // Command palette: find content without having to scroll through the page.
  const commands=[
    {label:'Explore the green methanol system',hint:'SYSTEMS VISION',keywords:'methanol systems vision ai renewable carbon capture interactive diagram',run:()=>goTo('methanol-vision')},
    {label:'Explore multiscale methanol assessment',hint:'MODELS & ASSESSMENT',keywords:'physics symbolic regression multiscale tea lca energy system assessment',run:()=>goTo('multiscale-assessment')},
    {label:'Explore the research',hint:'SECTION 01',keywords:'research methanol electrochemistry',run:()=>goTo('research')},
    {label:'Open the interactive playground',hint:'SECTION 02',keywords:'playground demo interactive topsis pareto',run:()=>goTo('playground')},
    {label:'Browse all publications and manuscripts',hint:'SECTION 03',keywords:'papers publications articles writing under review conference',run:()=>goTo('publications')},
    {label:'Meet the researcher',hint:'SECTION 04',keywords:'about cv biography education researcher',run:()=>goTo('about')},
    {label:'Teaching and maths support',hint:'SECTION 05',keywords:'teaching courses assistant maths support',run:()=>goTo('teaching')},
    {label:'Sustainable development goals',hint:'SECTION 06',keywords:'sustainability sdg sustainable development goals',run:()=>goTo('sustainability')},
    {label:'Start a conversation',hint:'CONTACT',keywords:'contact email collaboration',run:()=>goTo('contact')},
    {label:'Switch daylight / dusk',hint:'APPEARANCE',keywords:'theme dark light daylight dusk mode',run:toggleTheme},
    {label:'Pause / play motion',hint:'ACCESSIBILITY',keywords:'motion pause animation reduced accessibility',run:()=>setMotion(!hero.running)},
    {label:'Try a carbon-first preference',hint:'PLAYGROUND',keywords:'carbon first preset preference weights',run:()=>{applyPreset('carbon');goTo('playground');}},
    {label:'Reset to balanced preferences',hint:'PLAYGROUND',keywords:'reset balanced weights priorities',run:()=>{applyPreset('balanced');chart.reset();goTo('playground');}},
    {label:'Copy my email address',hint:'CONTACT',keywords:'copy email address',run:()=>copyText(content.email,'Email address copied.')}
  ];
  let filteredCommands=[],selectedCommand=0;
  function goTo(id){$(id).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});}
  function executeCommand(index){const action=filteredCommands[index];if(!action)return;command.close();action.run();}
  function renderCommands(){const term=$('command-input').value.toLowerCase().trim();filteredCommands=commands.filter(c=>(c.label+' '+c.keywords).toLowerCase().includes(term));selectedCommand=0;
    $('command-results').innerHTML=filteredCommands.length?filteredCommands.map((c,i)=>`<button class="command-result${i===0?' is-selected':''}" data-command="${i}">${escapeHTML(c.label)}<span>${escapeHTML(c.hint)}</span></button>`).join(''):'<div class="command-empty">No matching section or action.</div>';
  }
  function openCommand(){if(command.open){command.close();return;}$('command-input').value='';renderCommands();openDialog(command);$('command-input').focus();}
  $('command-trigger').addEventListener('click',openCommand);
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();}});
  $('command-input').addEventListener('input',renderCommands);
  $('command-input').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!filteredCommands.length)return;selectedCommand=(selectedCommand+(e.key==='ArrowDown'?1:-1)+filteredCommands.length)%filteredCommands.length;all('.command-result').forEach((b,i)=>b.classList.toggle('is-selected',i===selectedCommand));all('.command-result')[selectedCommand]?.scrollIntoView({block:'nearest'});}else if(e.key==='Enter'){e.preventDefault();executeCommand(selectedCommand);}});
  $('command-results').addEventListener('click',e=>{const button=e.target.closest('[data-command]');if(button)executeCommand(Number(button.dataset.command));});
})();
