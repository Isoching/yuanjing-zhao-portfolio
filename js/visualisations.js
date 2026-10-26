/* Self-contained canvas views and a transparent, deterministic decision-making demo.
   No network calls, dependencies, training, optimisation server or real research data. */
(() => {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rotate = ([x, y, z], yaw, pitch) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const xx = x * cy + z * sy, zz = -x * sy + z * cy;
    return [xx, y * cp - zz * sp, y * sp + zz * cp];
  };
  function contextFor(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('A 2D canvas context is required for the interactive illustrations.');
    const state = { canvas, ctx, w: 1, h: 1 };
    state.resize = () => {
      const rect = canvas.getBoundingClientRect();
      state.w = Math.max(1, rect.width); state.h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(state.w * dpr); canvas.height = Math.round(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    state.resize(); return state;
  }
  const getColour = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hexRGB = value => {
    let s = value.replace('#', '').trim();
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
  };
  const rgba = (hex, a) => { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${a})`; };

  class MoleculeView {
    constructor(canvas) {
      this.surface = contextFor(canvas); this.canvas = canvas;
      this.yaw = -.42; this.pitch = .22; this.running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.visible = true; this.drag = null; this.frame = null; this.lastTime = 0;
      this.atoms = [
        { p: [-.45, 0, 0], r: .38, type: 'C' },
        { p: [.96, .18, 0], r: .34, type: 'O' },
        { p: [-1.02, -.98, .62], r: .245, type: 'H' },
        { p: [-1.02, .99, .62], r: .245, type: 'H' },
        { p: [-.95, -.02, -1.13], r: .245, type: 'H' },
        { p: [1.56, -.59, .57], r: .245, type: 'H' }
      ];
      this.bonds = [[0,1],[0,2],[0,3],[0,4],[1,5]];
      this.resizeObserver = new ResizeObserver(() => { this.surface.resize(); this.draw(); });
      this.resizeObserver.observe(canvas);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting; this.syncAnimation();
      }, { threshold: 0.02 });
      this.intersectionObserver.observe(canvas);
      this.visibilityHandler = () => this.syncAnimation();
      document.addEventListener('visibilitychange', this.visibilityHandler);
      canvas.addEventListener('pointerdown', e => {
        this.drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch, touch: e.pointerType === 'touch' };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', e => {
        if (!this.drag) return;
        this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * .009;
        if (!this.drag.touch) this.pitch = clamp(this.drag.pitch + (e.clientY - this.drag.y) * .008, -1.2, 1.2);
        this.draw();
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => canvas.addEventListener(event, () => { this.drag = null; }));
      canvas.addEventListener('keydown', e => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'ArrowLeft') this.yaw -= .15;
        if (e.key === 'ArrowRight') this.yaw += .15;
        if (e.key === 'ArrowUp') this.pitch = clamp(this.pitch - .15, -1.2, 1.2);
        if (e.key === 'ArrowDown') this.pitch = clamp(this.pitch + .15, -1.2, 1.2);
        if (e.key === 'Home') { this.yaw = -.42; this.pitch = .22; }
        this.draw();
      });
      this.draw(); this.syncAnimation();
    }
    setRunning(value) { this.running = Boolean(value); this.syncAnimation(); }
    syncAnimation() {
      if (this.frame) { cancelAnimationFrame(this.frame); this.frame = null; }
      if (!this.running || !this.visible || document.hidden) return;
      this.lastTime = 0;
      const tick = time => {
        const dt = this.lastTime ? Math.min(time - this.lastTime, 50) : 0; this.lastTime = time;
        if (!this.drag) this.yaw += dt * .00011;
        this.draw();
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }
    draw() {
      const { ctx, w, h } = this.surface;
      if (w < 2 || h < 2) return;
      ctx.clearRect(0, 0, w, h);
      const dark = document.documentElement.dataset.theme === 'dusk';
      const ink = dark ? '#bdcdb8' : '#59725b';
      const scale = Math.min(w * .245, h * .205);
      const cx = w * .51, cy = h * .434;
      const project = p => {
        const r = rotate(p, this.yaw, this.pitch);
        const perspective = 5.8 / (5.8 + r[2]);
        return { x: cx + r[0] * scale * perspective, y: cy + r[1] * scale * perspective, z: r[2], k: perspective };
      };
      // A soft ground shadow, not a flat stock illustration.
      ctx.save(); ctx.translate(cx, cy + scale * 1.45); ctx.scale(1, .23);
      const shadow = ctx.createRadialGradient(0, 0, 10, 0, 0, scale * 1.5);
      shadow.addColorStop(0, dark ? '#101e1a60' : '#526b4120'); shadow.addColorStop(1, '#526b4100');
      ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(0, 0, scale * 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // Restrained construction lines imply a spatial model, not a literal electron orbital.
      for (let axis = 0; axis < 3; axis++) {
        ctx.beginPath();
        for (let i = 0; i <= 150; i++) {
          const t = i / 150 * Math.PI * 2, r = axis === 2 ? 1.88 : 2.03;
          const p = axis === 0 ? [r*Math.cos(t),r*Math.sin(t),0] : axis === 1 ? [r*Math.cos(t),0,r*Math.sin(t)] : [0,r*Math.cos(t),r*Math.sin(t)];
          const q = project(p); i === 0 ? ctx.moveTo(q.x,q.y) : ctx.lineTo(q.x,q.y);
        }
        ctx.strokeStyle = rgba(ink, axis === 0 ? .22 : .13); ctx.lineWidth = .65; ctx.stroke();
      }
      for (let i = 0; i < 38; i++) {
        const t = i * 2.39996, z = 1 - 2*(i+.5)/38, rr = Math.sqrt(1-z*z);
        const p = project([2.03*rr*Math.cos(t),2.03*rr*Math.sin(t),2.03*z]);
        ctx.fillStyle = rgba(ink, .25); ctx.beginPath(); ctx.arc(p.x,p.y,1,0,Math.PI*2); ctx.fill();
      }
      const projected = this.atoms.map(a => ({...a, ...project(a.p)}));
      // Bonds are drawn before the atom surfaces. Sphere shading establishes depth.
      this.bonds.slice().sort((a,b) => (projected[b[0]].z+projected[b[1]].z) - (projected[a[0]].z+projected[a[1]].z)).forEach(([i,j]) => {
        const a = projected[i], b = projected[j];
        ctx.lineCap = 'round';
        ctx.strokeStyle = dark ? '#485b4a' : '#a4b29c'; ctx.lineWidth = scale * .115;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        ctx.strokeStyle = dark ? '#839b7d' : '#dce4d3'; ctx.lineWidth = scale * .05;
        ctx.beginPath(); ctx.moveTo(a.x-1,a.y-2); ctx.lineTo(b.x-1,b.y-2); ctx.stroke();
      });
      projected.sort((a,b) => b.z-a.z).forEach(a => {
        const r = a.r * scale * a.k;
        const colours = a.type === 'C' ? (dark ? ['#c3d2b2','#859b78','#435d47'] : ['#b9cbae','#809a74','#4d6b50']) : a.type === 'O' ? (dark ? ['#e0c6b1','#b29983','#6f5b4c'] : ['#e5cdb9','#b69a82','#886d56']) : (dark ? ['#f5f4e8','#c9cdbd','#8e9b83'] : ['#ffffff','#eceee3','#b4c2a9']);
        ctx.save(); ctx.shadowColor = dark ? '#0c1e1730' : '#314f2925'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8;
        const grad = ctx.createRadialGradient(a.x-r*.36,a.y-r*.43,r*.03,a.x+r*.15,a.y+r*.15,r*1.12);
        grad.addColorStop(0,colours[0]); grad.addColorStop(.48,colours[1]); grad.addColorStop(1,colours[2]);
        ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(a.x,a.y,r,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.strokeStyle = dark ? '#d7e0c320' : '#ffffff55'; ctx.lineWidth=.7; ctx.beginPath(); ctx.arc(a.x,a.y,r-.5,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle = a.type === 'H' ? '#53644d' : '#f9faf1'; ctx.font = `${Math.max(10,r*.36)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a.type,a.x,a.y+1);
      });
      // Small reference frame.
      const ox = w-43, oy = h-144;
      [[[-.12,-.27,0],'y'],[[.28,0,0],'x'],[[0,0,.28],'z']].forEach(([p,label]) => {
        const r = rotate(p,this.yaw,this.pitch), x=ox+r[0]*48,y=oy+r[1]*48;
        ctx.strokeStyle=rgba(ink,.55);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(x,y);ctx.stroke();
        ctx.fillStyle=rgba(ink,.7);ctx.font='6px monospace';ctx.textAlign='center';ctx.fillText(label,x+(x-ox)*.4,y+(y-oy)*.4);
      });
    }
  }

  function makeDemoData() {
    const result = [], n = 12;
    for (let i=0; i<=n; i++) for (let j=0; j<=n-i; j++) {
      const a=i/n, b=j/n;
      result.push({id:`D-${String(result.length+1).padStart(3,'0')}`, i,j,
        carbon:55+35*(1-Math.exp(-1.6*(a+b)))/(1-Math.exp(-1.6)),
        energy:35+65*Math.pow(b,1.2), cost:35+65*Math.pow(a,1.2)});
    }
    return result;
  }
  function rankTOPSIS(data, rawWeights) {
    if (!Array.isArray(data) || data.length === 0) throw new Error('TOPSIS requires at least one design.');
    const keys=['carbon','energy','cost'];
    let weights=rawWeights.map(v => Number.isFinite(Number(v)) ? Math.max(0,Number(v)) : 0);
    const total=weights.reduce((s,v)=>s+v,0), zeroFallback=total===0;
    weights=zeroFallback ? [1/3,1/3,1/3] : weights.map(v=>v/total);
    const norms=keys.map(k=>Math.sqrt(data.reduce((s,p)=>s+p[k]*p[k],0)) || 1);
    const rows=data.map(p=>keys.map((k,j)=>p[k]/norms[j]*weights[j]));
    const ideal=keys.map((_,j)=>j===0 ? Math.max(...rows.map(r=>r[j])) : Math.min(...rows.map(r=>r[j])));
    const anti=keys.map((_,j)=>j===0 ? Math.min(...rows.map(r=>r[j])) : Math.max(...rows.map(r=>r[j])));
    const ranked=data.map((p,i)=>{
      const dPlus=Math.sqrt(rows[i].reduce((s,v,j)=>s+(v-ideal[j])**2,0));
      const dMinus=Math.sqrt(rows[i].reduce((s,v,j)=>s+(v-anti[j])**2,0));
      return {...p,score:dPlus+dMinus===0 ? .5 : dMinus/(dPlus+dMinus)};
    }).sort((a,b)=>Math.abs(b.score-a.score)>1e-12 ? b.score-a.score : a.id.localeCompare(b.id));
    ranked.forEach((p,i)=>{p.rank=i+1;});
    return {ranked, best:ranked[0], weights, zeroFallback};
  }

  class ParetoView {
    constructor(canvas, data, onSelect) {
      this.canvas=canvas;this.surface=contextFor(canvas);this.data=data;this.onSelect=onSelect;
      this.yaw=-.64;this.pitch=.36;this.view='3d';this.bestId=null;this.selectedId=null;this.drag=null;this.positions=[];
      this.tooltip=document.getElementById('chart-tooltip');this.hoverId=null;
      this.resizeObserver=new ResizeObserver(()=>{this.surface.resize();this.draw();});this.resizeObserver.observe(canvas);
      canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch,moved:false,touch:e.pointerType==='touch'};canvas.setPointerCapture(e.pointerId);this.hideTooltip();});
      canvas.addEventListener('pointermove',e=>{
        if(this.drag){
          const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
          if(Math.hypot(dx,dy)>5)this.drag.moved=true;
          if(this.view==='3d'){this.yaw=this.drag.yaw+dx*.008;if(!this.drag.touch)this.pitch=clamp(this.drag.pitch+dy*.006,-1.1,1.1);this.draw();}
        }else{this.hoverAt(e);}
      });
      canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved){const p=this.hitAt(e);if(p)this.onSelect(p.id);}this.drag=null;});
      ['pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,()=>{this.drag=null;}));
      canvas.addEventListener('pointerleave',()=>this.hideTooltip());
      canvas.addEventListener('keydown',e=>{
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){
          e.preventDefault();
          if(e.key==='Home'){this.reset();return;}
          if(this.view==='3d'){
            if(e.key==='ArrowLeft')this.yaw-=.13;if(e.key==='ArrowRight')this.yaw+=.13;
            if(e.key==='ArrowUp')this.pitch=clamp(this.pitch-.13,-1.1,1.1);if(e.key==='ArrowDown')this.pitch=clamp(this.pitch+.13,-1.1,1.1);
            this.draw();
          }else{
            const current=Math.max(0,this.data.findIndex(p=>p.id===this.selectedId));
            const next=(current+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+this.data.length)%this.data.length;
            this.onSelect(this.data[next].id);
          }
        }
      });
      this.draw();
    }
    setSelection(bestId,selectedId){this.bestId=bestId;this.selectedId=selectedId;this.draw();}
    setView(view){this.view=view==='2d'?'2d':'3d';this.hideTooltip();this.draw();}
    reset(){this.yaw=-.64;this.pitch=.36;this.hideTooltip();this.draw();}
    hitAt(e){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let nearest=null,distance=13;this.positions.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;nearest=p;}});return nearest;}
    hoverAt(e){const p=this.hitAt(e);if(!p){this.hideTooltip();return;}this.hoverId=p.id;
      const data=this.data.find(d=>d.id===p.id);this.tooltip.replaceChildren();
      const title=document.createElement('strong');title.textContent=data.id+(p.id===this.bestId?' · recommended':'');this.tooltip.append(title);
      const text=document.createElement('span');text.textContent=`Carbon ${data.carbon.toFixed(1)} · Energy ${data.energy.toFixed(1)} · Capital ${data.cost.toFixed(1)}`;this.tooltip.append(text);
      this.tooltip.style.left=`${clamp(p.x+12,4,this.surface.w-212)}px`;this.tooltip.style.top=`${clamp(p.y-75,6,this.surface.h-80)}px`;this.tooltip.style.maxWidth='208px';this.tooltip.hidden=false;
    }
    hideTooltip(){this.hoverId=null;if(this.tooltip)this.tooltip.hidden=true;}
    draw(){
      const {ctx,w,h}=this.surface;if(w<2||h<2)return;ctx.clearRect(0,0,w,h);
      const col={line:'#769984',muted:'#b4c6bb',point:'#9bbdad',best:'#e7d7a8',white:'#f0f2df'};
      this.positions=[];ctx.font='9px Arial, sans-serif';ctx.textBaseline='middle';
      if(this.view==='2d'){this.draw2D(ctx,w,h,col);return;}
      const scale=Math.min(w*.255,h*.34),cx=w*.51,cy=h*.49;
      const project=p=>{const r=rotate(p,this.yaw,this.pitch);return{x:cx+r[0]*scale,y:cy+r[1]*scale,z:r[2]};};
      const world=p=>[(p.cost-35)/65*2-1,1-(p.carbon-55)/35*2,(p.energy-35)/65*2-1];
      const line=(a,b,colour,width=.6,dash=[])=>{const aa=project(a),bb=project(b);ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.lineTo(bb.x,bb.y);ctx.stroke();ctx.setLineDash([]);};
      // A light reference box with two gridded planes.
      for(let i=0;i<=4;i++){const t=-1+i*.5;line([t,1,-1],[t,1,1],rgba(col.line,.2));line([-1,1,t],[1,1,t],rgba(col.line,.2));line([-1,t,-1],[1,t,-1],rgba(col.line,.12));line([t,-1,-1],[t,1,-1],rgba(col.line,.12));}
      const origin=[-1,1,-1];
      line(origin,[1,1,-1],rgba(col.line,.75),1);line(origin,[-1,-1,-1],rgba(col.line,.75),1);line(origin,[-1,1,1],rgba(col.line,.75),1);
      const labels=[{p:[1.13,1,-1],s:'Capital index',dx:5,dy:9},{p:[-1,-1.17,-1],s:'Carbon index',dx:0,dy:-5},{p:[-1,1,1.16],s:'Electricity index',dx:-3,dy:14}];
      labels.forEach(l=>{const p=project(l.p);ctx.fillStyle=col.muted;ctx.textAlign='center';ctx.font=`${w<400?8:9}px Arial, sans-serif`;const tw=ctx.measureText(l.s).width;ctx.fillText(l.s,clamp(p.x+l.dx,tw/2+2,w-tw/2-2),clamp(p.y+l.dy,12,h-12));});
      const index=new Map(this.data.map(p=>[`${p.i},${p.j}`,p]));
      this.data.forEach(p=>{[[p.i+1,p.j],[p.i,p.j+1]].forEach(([i,j])=>{const q=index.get(`${i},${j}`);if(q)line(world(p),world(q),rgba(col.point,.19),.6);});});
      this.positions=this.data.map(p=>({...p,...project(world(p))}));
      const chosen=this.data.find(p=>p.id===this.bestId);
      if(chosen){const pp=world(chosen);line(pp,[pp[0],1,pp[2]],rgba(col.best,.5),1,[3,4]);}
      this.positions.slice().sort((a,b)=>b.z-a.z).forEach(p=>this.dot(ctx,p,p.id===this.bestId?4.8:2.7,clamp(.72-p.z*.12,.4,1),col));
      const best=this.positions.find(p=>p.id===this.bestId);
      if(best){this.drawTag(ctx,best,w,h,col);}
    }
    dot(ctx,p,r,alpha,col){
      const best=p.id===this.bestId,inspected=p.id===this.selectedId&&!best;
      if(best){ctx.fillStyle=rgba(col.best,.1);ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle=rgba(col.best,.8);ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,8.5,0,Math.PI*2);ctx.stroke();}
      if(inspected){ctx.strokeStyle=col.white;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle=rgba(best?col.best:col.point,alpha);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
    }
    drawTag(ctx,p,w,h,col){
      const text=p.id+'  ↗',tw=49,th=21,x=clamp(p.x+14,2,w-tw-2),y=clamp(p.y-28,2,h-th-2);
      ctx.fillStyle='#233e35';ctx.fillRect(x,y,tw,th);ctx.strokeStyle=rgba(col.best,.55);ctx.lineWidth=.7;ctx.strokeRect(x,y,tw,th);
      ctx.fillStyle=col.best;ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+tw/2,y+th/2);
    }
    draw2D(ctx,w,h,col){
      const pad={left:50,right:22,top:36,bottom:50},pw=w-pad.left-pad.right,ph=h-pad.top-pad.bottom;
      const point=p=>({x:pad.left+(p.energy-35)/65*pw,y:pad.top+(90-p.carbon)/35*ph});
      ctx.font='8px Arial, sans-serif';
      [35,50,65,80,100].forEach(v=>{const x=pad.left+(v-35)/65*pw;ctx.strokeStyle=rgba(col.line,.22);ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,pad.top);ctx.lineTo(x,h-pad.bottom);ctx.stroke();ctx.fillStyle=col.muted;ctx.textAlign='center';ctx.fillText(String(v),x,h-pad.bottom+16);});
      [55,65,75,90].forEach(v=>{const y=pad.top+(90-v)/35*ph;ctx.strokeStyle=rgba(col.line,.22);ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(w-pad.right,y);ctx.stroke();ctx.fillStyle=col.muted;ctx.textAlign='right';ctx.fillText(String(v),pad.left-10,y);});
      ctx.fillStyle=col.muted;ctx.textAlign='left';ctx.font='8px Arial, sans-serif';ctx.fillText('Carbon index ↑',pad.left,13);ctx.textAlign='right';ctx.fillText('Size = capital index',w-pad.right,13);ctx.textAlign='center';ctx.fillText('Electricity index →',pad.left+pw/2,h-10);
      this.positions=this.data.map(p=>({...p,...point(p)}));
      this.positions.forEach(p=>this.dot(ctx,p,p.id===this.bestId?5:2.2+(p.cost-35)/65*2.6,.8,col));
      const best=this.positions.find(p=>p.id===this.bestId);if(best)this.drawTag(ctx,best,w,h,col);
    }
  }
  window.PortfolioViz={MoleculeView,ParetoView,makeDemoData,rankTOPSIS};
})();
