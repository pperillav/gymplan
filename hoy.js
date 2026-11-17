/* =====================================================================
   VISTA HOY: semana, rutina del día, registro por serie, descansos
   ===================================================================== */
const S = {fecha: hoyISO(), abiertas: new Set(), expandidos: new Set(), vista: 'hoy', hoyAl: hoyISO(), ultimaFecha: null};

function lineaDiscos(kg){
  const r = discosPorLado(kg);
  if(!r) return '<div class="calent">Carga con discos: registra el total de ambos lados (sin contar el carro).</div>';
  return `<div class="calent discos">Discos por lado para ${fmtKg(kg)} kg: <b>${r.discos.length ? r.discos.join(' + ') : '—'}</b>${r.resto ? ` (+${fmtKg(r.resto)} kg sin disco exacto)` : ''}</div>`;
}
function textoFC(intervalos){
  const z = zonasFC();
  if(!z) return 'Agrega tu edad en Nutrición para ver tu zona de pulso.';
  return intervalos ? `Tramos fuertes: ${z.hiit}+ lpm · suaves: menos de ${z.z2[1]} lpm`
                    : `Zona 2: ${z.z2[0]}–${z.z2[1]} lpm (si puedes hablar en frases, vas bien)`;
}
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function etiquetaNum(mq){
  if(/^\d+$/.test(mq.num)) return 'Nº ' + mq.num;
  return ({ART:'Articulada', P:'Polea', M:'Mancuernas', V:'Zona brazos', GZ:'Glute Zone'})[mq.num] || '';
}
const fmtFechaLarga = f => { const t = parseIso(f).toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long'}); return t.charAt(0).toUpperCase() + t.slice(1); };

/* Primer ejercicio obligatorio con series pendientes después de "desdeId" */
function siguientePendiente(f, desdeId){
  const slots = slotsDe(rutinaDe(f)).filter(s => !s.opc);
  const i = slots.findIndex(s => s.id === desdeId);
  const orden = i >= 0 ? [...slots.slice(i + 1), ...slots.slice(0, i)] : slots;
  return orden.find(s => {
    const n = seriesDe(s, f), l = logDe(f, s.id);
    return (l && Array.isArray(l.sets) ? l.sets.slice(0, n).filter(x => x && x.ok).length : 0) < n;
  }) || null;
}
function pararDescanso(){ clearInterval(timerId); timerId = null; $('descanso').classList.add('hidden'); try{ localStorage.removeItem('sfv4-descanso'); }catch(e){} }

function renderHoy(){
  const f = S.fecha, rut = rutinaDe(f);
  if(S.ultimaFecha !== f){ S.abiertas.clear(); S.expandidos.clear(); S.ultimaFecha = f; }
  document.documentElement.style.setProperty('--tema', ZONAS[rut.tema].c);
  const nota = $('notaSesion');
  if(document.activeElement !== nota) nota.value = (DB.days[f] && DB.days[f].nota) || '';
  renderSemana(); renderStats(); renderAvisos(); renderResumen();
  const semN = semanaPlan(f);
  $('diaTitulo').innerHTML = `${esc(rut.nombre)} <span class="acento">· ${esc(rut.sub)}</span>`;
  $('diaMeta').textContent = [fmtFechaLarga(f), semN ? `semana ${semN}${esDescarga(f) ? ' (descarga)' : ''}` : '', rut.descanso ? '' : `~${duracionEstimada(rut)} min`].filter(Boolean).join(' · ');
  $('selRutina').innerHTML = PLAN.map(d => `<option value="${d.id}" ${d.id === rut.id ? 'selected' : ''}>${esc(d.dia)} · ${esc(d.nombre)}</option>`).join('');
  const tip = TIPS[Math.floor(parseIso(f).getTime()/864e5) % TIPS.length];
  $('foco').innerHTML = `${esc(rut.foco)}${rut.descanso ? '' : '<br><b>RIR</b> = repeticiones que te quedan en reserva al terminar la serie.'}<div class="tipdia"><b>Tip · ${esc(tip.c)}:</b> ${esc(tip.t)}</div>`;
  renderLista(); renderHabitos();
}

function renderSemana(){
  const lun = lunesDe(parseIso(S.fecha)), hoy = hoyISO();
  $('semanaTxt').textContent = `${fmtLargo(iso(lun))} – ${fmtLargo(iso(addDays(lun, 6)))}`;
  $('btnHoy').classList.toggle('hidden', S.fecha === hoy);
  const bar = $('diasbar'); bar.innerHTML = '';
  for(let i = 0; i < 7; i++){
    const k = iso(addDays(lun, i)), p = progresoDia(k);
    const pct = p.t ? Math.round(p.h/p.t*100) : 0;
    const b = document.createElement('button');
    b.className = 'dia' + (k === S.fecha ? ' activo' : '') + (p.hecho ? ' hecho' : '') + (k === hoy ? ' eshoy' : '');
    b.innerHTML = `<div class="d"><span>${DIAS_CORTOS[i]} ${parseIso(k).getDate()}</span><span class="ok">${p.hecho ? '✓' : (p.h ? pct + '%' : '')}</span></div><div class="n">${esc(p.rut.nombre)}</div>`;
    b.onclick = () => { S.fecha = k; S.abiertas.clear(); renderHoy(); };
    bar.appendChild(b);
  }
  const act = bar.querySelector('.activo');
  if(act) bar.scrollLeft = act.offsetLeft - bar.clientWidth/2 + act.clientWidth/2;
}

function renderStats(){
  $('stRacha').textContent = calcRacha();
  const s = statsSemana(S.fecha);
  $('stSemana').textContent = `${s.hechas}/${s.plan}`;
  $('stTotal').textContent = totalSesiones();
}

function renderAvisos(){
  const av = [], hoy = hoyISO();
  if(!DB.settings.onboard){
    av.push(`<div class="aviso"><b>Primeros pasos</b><ol>
      <li>Registra tu peso y cintura en <a data-ir="progreso">Progreso</a>.</li>
      <li>Completa tus datos en <a data-ir="nutri">Nutrición</a> para calcular tu proteína.</li>
      <li>La primera vez en cada máquina toca su dibujo y anota tus ajustes (asiento, respaldo).</li>
      <li>En cada serie escribe kg y reps y toca ✓. Si dejas un campo vacío se usa el valor gris sugerido.</li></ol>
      <button class="btn mini pri" id="okOnboard">Entendido</button></div>`);
  }
  if(esDescarga(S.fecha)) av.push(`<div class="aviso descarga"><b>Semana de descarga.</b> La mitad de las series con la misma carga y lejos del fallo. Es parte del plan: recuperas y vuelves más fuerte.</div>`);
  const pesos = DB.body.filter(b => b.peso);
  const ult = pesos.length ? pesos[pesos.length-1].f : null;
  if(DB.settings.onboard && S.fecha === hoy && (!ult || difDias(hoy, ult) >= 7)){
    av.push(`<div class="aviso"><b>${ult ? `Hace ${difDias(hoy, ult)} días que no registras tu peso.` : 'Aún no registras tu peso.'}</b> Sin ese dato la app no puede decirte si pierdes grasa o músculo. <a data-ir="progreso">Registrar ahora</a></div>`);
  }
  const ultR = DB.settings.ultimoRespaldo;
  if(DB.settings.onboard && S.fecha === hoy && Object.keys(DB.days).length >= 4 && (!ultR || difDias(hoy, ultR) >= 14)){
    av.push(`<div class="aviso"><b>${ultR ? `Hace ${difDias(hoy, ultR)} días que no haces un respaldo.` : 'Aún no has hecho un respaldo.'}</b> Guárdalo en Drive o envíatelo por WhatsApp para no perder tu progreso si cambias de teléfono. <a data-accion="respaldo">Hacer respaldo</a></div>`);
  }
  $('avisos').innerHTML = av.join('');
  $('avisos').querySelectorAll('[data-accion="respaldo"]').forEach(a => a.onclick = () => compartirRespaldo());
  const okb = $('okOnboard');
  if(okb) okb.onclick = () => { DB.settings.onboard = true; guardarDB(); renderAvisos(); };
  $('avisos').querySelectorAll('[data-ir]').forEach(a => a.onclick = () => ir(a.dataset.ir));
}

function renderResumen(){
  const p = progresoDia(S.fecha);
  const pct = p.t ? Math.round(p.h/p.t*100) : 0;
  $('arco').style.strokeDashoffset = 213.6*(1 - pct/100);
  $('pct').textContent = p.descanso ? '—' : pct + '%';
  $('series').textContent = p.descanso ? 'descanso' : `${p.h}/${p.t} series`;
  pintarReloj();
}
function pintarReloj(){
  const d = DB.days[S.fecha], el = $('reloj');
  if(d && d.inicio){
    const min = Math.max(0, Math.round(((d.fin || Date.now()) - d.inicio)/60000));
    el.textContent = (d.fin ? 'Sesión: ' : 'En curso: ') + min + ' min';
    el.classList.remove('hidden');
  } else el.classList.add('hidden');
}

/* ---------------- tarjetas ---------------- */
function renderLista(){
  const f = S.fecha, rut = rutinaDe(f);
  let html = rut.descanso ? `<div class="card"><div class="nom">Día de recuperación</div><p class="muted">Sin pesas. Camina, duerme bien y prepara tus comidas de la semana. Si caminas, regístralo abajo.</p></div>${revisionHTML(f)}` : '';
  rut.bloques.forEach(b => {
    html += `<div class="sec-t">${esc(b.t)}</div>`;
    b.slots.forEach(s => { html += compactoHTML(s, f) || (s.cardio ? cardioHTML(s, f) : slotHTML(s, f)); });
  });
  $('lista').innerHTML = html;
}

/* Ejercicio terminado: una línea compacta (tócala para ver el detalle) */
function compactoHTML(s, f){
  if(S.expandidos.has(s.id) || S.abiertas.has(s.id)) return '';
  const n = seriesDe(s, f), l = logDe(f, s.id);
  const sets = (l && Array.isArray(l.sets)) ? l.sets.slice(0, n) : [];
  if(sets.length < n || !sets.every(x => x && x.ok)) return '';
  const mq = MAQ[maquinaDe(s, f)], col = ZONAS[mq.zona].c;
  const det = s.cardio ? `${sets[0].min ?? s.min} min`
    : `${[...new Set(sets.map(x => fmtKg(x.kg)))].join('/')} kg × ${sets.map(x => x.reps ?? '?').join('/')} reps`;
  return `<article class="ej hecho compacto" data-card="${s.id}" data-expandir="${s.id}" style="--z:${col}" role="button" aria-label="${esc(mq.n)} terminado. Toca para ver el detalle">
    <span class="badge-mini">${esc(mq.tipo === 'cardio' ? '♥' : mq.num)}</span>
    <span class="c-txt"><span class="c-nom">${esc(mq.n)}</span><span class="c-det">${esc(det)}</span></span><span class="c-ok">✓</span></article>`;
}

/* Revisión de la semana (domingo en Hoy y en Progreso) */
function revisionHTML(f, sinSemaforo){
  const r = resumenSemana(f, sinSemaforo);
  const dv = r.volPrev ? Math.round((r.vol - r.volPrev)/r.volPrev*100) : null;
  const dp = (r.pm !== null && r.pp !== null) ? r.pm - r.pp : null;
  const t = v => v >= 1000 ? (v/1000).toFixed(1) + ' t' : Math.round(v) + ' kg';
  return `<div class="card revision" style="--z:var(--sf)">
    <div class="nom">Revisión de la semana</div>
    <div class="kpi">
      <div class="stat"><div class="v">${r.hechas}/${r.plan}</div><div class="l">Sesiones</div></div>
      <div class="stat"><div class="v">${t(r.vol)}</div><div class="l">Volumen${dv !== null ? ` ${dv >= 0 ? '+' : ''}${dv}%` : ''}</div></div>
      <div class="stat"><div class="v">${r.habPct}%</div><div class="l">Hábitos</div></div>
    </div>
    ${dp !== null ? `<div class="row"><span class="muted">Peso medio vs. semana anterior</span><b>${dp >= 0 ? '+' : ''}${dp.toFixed(1)} kg</b></div>` : ''}
    ${r.recs.length ? `<ul class="tips">${r.recs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">Sin alertas esta semana. Sigue así.</p>'}
  </div>`;
}

function slotHTML(s, f){
  const mid = maquinaDe(s, f), mq = MAQ[mid], col = ZONAS[mq.zona].c;
  const n = seriesDe(s, f), l = logDe(f, s.id), sets = (l && l.sets) || [];
  const hechos = sets.slice(0, n).filter(x => x && x.ok).length;
  const sug = sugerir(s, mid, f), disp = disponibles(s);
  const nota = DB.maq[mid] && DB.maq[mid].nota;
  const rango = s.r[0] === s.r[1] ? s.r[0] : `${s.r[0]}–${s.r[1]}`;
  let filas = '', kgArrastre = sug.kg, repsArrastre = null;
  for(let i = 0; i < n; i++){
    const x = sets[i] || {};
    // el valor gris se hereda de la serie anterior (escrita o sugerida)
    const phKg = kgArrastre != null ? fmtKg(kgArrastre) : 'kg';
    const phReps = (sug.prev && sug.prev[i]) || repsArrastre || s.r[0];
    kgArrastre = x.kg != null ? x.kg : kgArrastre;
    repsArrastre = x.reps != null ? x.reps : phReps;
    filas += `<div class="serie ${x.ok ? 'ok' : ''}">
      <span class="sn">${i+1}</span>
      <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="${phKg}" value="${x.kg ?? ''}" data-kg="${s.id}|${i}" aria-label="Carga serie ${i+1}">
      <span class="x">kg ×</span>
      <input type="number" inputmode="numeric" step="1" min="0" placeholder="${phReps}" value="${x.reps ?? ''}" data-reps="${s.id}|${i}" aria-label="Repeticiones serie ${i+1}">
      <button class="chk ${x.ok ? 'on' : ''}" data-ok="${s.id}|${i}" aria-label="Serie ${i+1} hecha">✓</button>
    </div>`;
  }
  const selMaq = disp.length > 1 ? `<label class="cambiar">¿Ocupada? Cambia:
      <select data-maq="${s.id}">${disp.map(id => `<option value="${id}" ${id === mid ? 'selected' : ''}>${esc(etiquetaNum(MAQ[id]))} · ${esc(MAQ[id].n)}</option>`).join('')}</select></label>` : '';
  return `<article class="ej ${hechos >= n ? 'hecho' : ''} ${s.opc ? 'opc' : ''}" data-card="${s.id}" style="--z:${col}">
    ${hechos >= n ? `<button class="contraer" data-contraer="${s.id}">Contraer ▴</button>` : ''}
    <div class="ej-top">
      <button class="picto" data-guia="${s.id}" aria-label="Técnica de ${esc(mq.n)}">${pict(mq.p, col)}<span class="badge">${esc(mq.num)}</span></button>
      <div>
        <div class="nom">${esc(mq.n)}${s.opc ? '<span class="tag">opcional</span>' : ''}</div>
        <div class="sub"><span class="zona-dot"></span>${esc(etiquetaNum(mq))} · ${esc(mq.mus)}</div>
        <div class="presc">${n} × ${rango} reps · RIR ${esDescarga(f) ? '3–4' : s.rir} · descanso ${fmtSeg(s.rest)}</div>
        <div class="nota-maq ${nota ? '' : 'vacia'}" data-guia="${s.id}">⚙ ${nota ? esc(nota) : 'Anotar ajustes de la máquina'}</div>
      </div>
    </div>
    ${selMaq}
    ${s.nota ? `<div class="slot-nota">${esc(s.nota)}</div>` : ''}
    <div class="sug ${sug.tipo}">${esc(sug.txt)}${s.principal ? `<div class="calent">${esc(calentamiento(sug.kg, mid))}</div>` : ''}${mq.tipo === 'discos' ? lineaDiscos(sug.kg) : ''}</div>
    <div class="series">${filas}</div>
    <div class="guia ${S.abiertas.has(s.id) ? 'abierta' : ''}">${guiaHTML(mid, f)}</div>
  </article>`;
}

function guiaHTML(mid, f){
  const mq = MAQ[mid], col = ZONAS[mq.zona].c, cfg = DB.maq[mid] || {};
  const hist = sesionesMaquina(mid, f).slice(0, 3);
  const histHTML = hist.length
    ? hist.map(h => `<div class="row"><span>${fmtCorto(h.f)}</span><span>${h.sets.map(x => `${fmtKg(x.kg)}×${x.reps ?? '?'}`).join(' · ')}</span></div>`).join('')
    : '<p class="muted">Sin historial todavía en esta máquina.</p>';
  return `<div class="guia-top">
      <div class="gsvg" style="background:color-mix(in srgb, ${col} 14%, var(--card2))">${pict(mq.p, col)}</div>
      <div><span class="musc" style="background:${col}">${esc(mq.mus)}</span>
        <div class="tipo">${esc(TIPO_TXT[mq.tipo] || '')}</div>
        ${mq.ajuste ? `<p class="muted"><b>Ajuste:</b> ${esc(mq.ajuste)}</p>` : ''}</div>
    </div>
    <ul class="tips">${(mq.tips || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    ${mq.error ? `<div class="error"><b>Error común:</b> ${esc(mq.error)}</div>` : ''}
    ${mq.molestia ? `<div class="molestia"><b>Si te molesta:</b> ${esc(mq.molestia)} Si el dolor es agudo o no cede, detente y consulta.</div>` : ''}
    <div class="mis-ajustes">
      <label>Mis ajustes<input type="text" maxlength="80" placeholder="Ej.: asiento 4 · respaldo 2" value="${esc(cfg.nota || '')}" data-nota="${mid}"></label>
      <label>Incremento<select data-inc="${mid}"><option value="">General (${fmtKg(DB.settings.incremento)} kg)</option>${[1, 1.25, 2.5, 5, 10].map(v => `<option value="${v}" ${String(cfg.inc) === String(v) ? 'selected' : ''}>${v} kg</option>`).join('')}</select></label>
    </div>
    <div class="sec-mini">Últimas sesiones</div>${histHTML}`;
}

function cardioHTML(s, f){
  const mid = maquinaDe(s, f), mq = MAQ[mid], col = ZONAS.cardio.c;
  const l = logDe(f, s.id) || {}, x = (l.sets && l.sets[0]) || {};
  const disp = disponibles(s);
  const prot = s.protocolos ? (l.prot || s.protocolos[0].v) : null;
  const po = s.protocolos ? s.protocolos.find(p => p.v === prot) : null;
  const minPlan = po ? po.min : s.min;
  return `<article class="ej ${x.ok ? 'hecho' : ''} ${s.opc ? 'opc' : ''}" data-card="${s.id}" style="--z:${col}">
    ${x.ok ? `<button class="contraer" data-contraer="${s.id}">Contraer ▴</button>` : ''}
    <div class="ej-top">
      <button class="picto" data-guia="${s.id}" aria-label="Indicaciones de ${esc(mq.n)}">${pict(mq.p, col)}</button>
      <div><div class="nom">${esc(mq.n)}${s.opc ? '<span class="tag">opcional</span>' : ''}</div>
        <div class="presc">${esc(po ? po.t : (s.txt || ''))}</div>
        <div class="sub fc">♥ ${esc(textoFC(prot === 'hiit' || !!s.hiit))}</div></div>
    </div>
    ${disp.length > 1 ? `<label class="cambiar">Equipo: <select data-maq="${s.id}">${disp.map(id => `<option value="${id}" ${id === mid ? 'selected' : ''}>${esc(MAQ[id].n)}</option>`).join('')}</select></label>` : ''}
    ${s.protocolos ? `<label class="cambiar">Modalidad: <select data-prot="${s.id}">${s.protocolos.map(p => `<option value="${p.v}" ${p.v === prot ? 'selected' : ''}>${esc(p.t)}</option>`).join('')}</select></label>` : ''}
    <div class="series"><div class="serie cardio-fila ${x.ok ? 'ok' : ''}"><span class="x">Minutos</span>
      <input type="number" inputmode="numeric" min="0" placeholder="${minPlan}" value="${x.min ?? ''}" data-min="${s.id}">
      <button class="chk ancho ${x.ok ? 'on' : ''}" data-ok="${s.id}|0">${x.ok ? '✓ Hecho' : 'Marcar hecho'}</button></div></div>
    <div class="guia ${S.abiertas.has(s.id) ? 'abierta' : ''}"><ul class="tips">${mq.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${mq.error ? `<div class="error"><b>Evita:</b> ${esc(mq.error)}</div>` : ''}</div>
  </article>`;
}

/* ---------------- acciones ---------------- */
function marcarSerie(id, i){
  const ref = SLOT[id]; if(!ref) return;
  const slot = ref.slot, f = S.fecha;
  asegurarAudio();
  const antes = progresoDia(f);
  const l = logW(f, slot), n = seriesDe(slot, f);
  while(l.sets.length <= i) l.sets.push({kg:null, reps:null, ok:false});
  const x = l.sets[i];
  if(!x.ok){
    if(slot.cardio){
      const inp = document.querySelector(`[data-min="${id}"]`);
      x.min = num(inp && inp.value) ?? num(inp && inp.placeholder);
    } else {
      const ik = document.querySelector(`[data-kg="${id}|${i}"]`), ir2 = document.querySelector(`[data-reps="${id}|${i}"]`);
      const kg = num(ik && ik.value) ?? num(ik && ik.placeholder);
      const reps = num(ir2 && ir2.value) ?? num(ir2 && ir2.placeholder);
      if(kg === null){ toast('Escribe la carga de esta serie'); if(ik) ik.focus(); return; }
      x.kg = kg; x.reps = reps;
    }
    x.ok = true;
    if(DB.settings.feedback && navigator.vibrate) navigator.vibrate(15);
    l.m = l.m || maquinaDe(slot, f);
    DB.pref[slot.id] = l.m;
    const d = diaW(f);
    if(!d.inicio) d.inicio = Date.now();
    delete d.fin;
    if(!slot.cardio){
      const sig = l.sets.findIndex((y, k) => k < n && !(y && y.ok));
      if(sig !== -1 || l.sets.length < n){
        const j = sig !== -1 ? sig : l.sets.length;
        iniciarDescanso(slot.rest, `Siguiente: serie ${j+1} de ${n} · ${fmtKg(x.kg)} kg × ${slot.r[0]}–${slot.r[1]}`);
      } else {
        const prox = siguientePendiente(f, slot.id);
        if(prox && !prox.cardio){
          const pm = MAQ[maquinaDe(prox, f)];
          iniciarDescanso(Math.min(slot.rest, 120), `Siguiente ejercicio: ${etiquetaNum(pm)} · ${pm.n}`);
        } else if(prox){ pararDescanso(); toast(`${MAQ[l.m].n} listo. Sigue: ${MAQ[maquinaDe(prox, f)].n}`); }
        else pararDescanso();
      }
    }
    pedirPantalla();
  } else {
    x.ok = false;
  }
  guardarDB();
  const ejCompleto = x.ok && l.sets.slice(0, n).length >= n && l.sets.slice(0, n).every(y => y && y.ok);
  if(!x.ok || ejCompleto) S.expandidos.delete(id);
  if(ejCompleto) S.abiertas.delete(id);   // ejercicio terminado: se contrae
  renderHoy();
  const despues = progresoDia(f);
  if(!antes.completo && despues.completo) setTimeout(() => mostrarResumen(), 400);
  else if(ejCompleto){ const prox = siguientePendiente(f, slot.id); if(prox) setTimeout(() => irATarjeta(prox.id), 150); }
}
function irATarjeta(id){
  const el = document.querySelector(`[data-card="${id}"]`);
  if(el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 12, behavior: 'smooth'});
}

function guardarValor(id, i, campo, valor){
  const ref = SLOT[id]; if(!ref) return;
  const l = logW(S.fecha, ref.slot);
  while(l.sets.length <= i) l.sets.push({kg:null, reps:null, ok:false});
  l.sets[i][campo] = num(valor);
  guardarDB();
}

function cambiarMaquina(id, mid){
  const ref = SLOT[id]; if(!ref) return;
  const l = logW(S.fecha, ref.slot);
  if(l.sets.some(x => x && x.ok) && !confirm('Cambiar de máquina reinicia las series de este ejercicio (las cargas no son comparables entre máquinas). ¿Continuar?')){ renderLista(); return; }
  if(l.m !== mid) l.sets = [];
  l.m = mid; DB.pref[id] = mid;
  guardarDB(); renderHoy();
}

$('lista').addEventListener('click', ev => {
  const ex = ev.target.closest('[data-expandir]');
  if(ex){ S.expandidos.add(ex.dataset.expandir); renderLista(); return; }
  const co = ev.target.closest('[data-contraer]');
  if(co){ S.expandidos.delete(co.dataset.contraer); S.abiertas.delete(co.dataset.contraer); renderLista(); return; }
  const g = ev.target.closest('[data-guia]');
  if(g){ const id = g.dataset.guia; S.abiertas.has(id) ? S.abiertas.delete(id) : S.abiertas.add(id); renderLista(); return; }
  const o = ev.target.closest('[data-ok]');
  if(o){ const [id, i] = o.dataset.ok.split('|'); marcarSerie(id, +i); }
});
$('lista').addEventListener('change', ev => {
  const t = ev.target, ds = t.dataset;
  if(ds.kg){ const [id, i] = ds.kg.split('|'); guardarValor(id, +i, 'kg', t.value); return; }
  if(ds.reps){ const [id, i] = ds.reps.split('|'); guardarValor(id, +i, 'reps', t.value); return; }
  if(ds.min){ guardarValor(ds.min, 0, 'min', t.value); return; }
  if(ds.maq){ cambiarMaquina(ds.maq, t.value); return; }
  if(ds.prot){ const ref = SLOT[ds.prot]; logW(S.fecha, ref.slot).prot = t.value; guardarDB(); renderLista(); return; }
  if(ds.nota !== undefined){ (DB.maq[ds.nota] = DB.maq[ds.nota] || {}).nota = t.value.trim(); guardarDB(); renderLista(); toast('Ajustes guardados'); return; }
  if(ds.inc !== undefined){ (DB.maq[ds.inc] = DB.maq[ds.inc] || {}).inc = num(t.value); guardarDB(); renderLista(); }
});

$('selRutina').onchange = ev => {
  const d = diaW(S.fecha), v = ev.target.value;
  if(v === PLAN[diaSemana(S.fecha)].id) delete d.rutina; else d.rutina = v;
  S.abiertas.clear(); guardarDB(); renderHoy();
};
$('semPrev').onclick = () => { S.fecha = iso(addDays(parseIso(S.fecha), -7)); renderHoy(); };
$('semNext').onclick = () => { S.fecha = iso(addDays(parseIso(S.fecha), 7)); renderHoy(); };
$('btnHoy').onclick = () => { S.fecha = S.hoyAl = hoyISO(); renderHoy(); };
$('btnReiniciar').onclick = () => {
  if(!confirm('¿Borrar las series registradas de este día? Tus hábitos y ajustes se conservan.')) return;
  const d = DB.days[S.fecha];
  if(d){ delete d.log; delete d.inicio; delete d.fin; delete d.legacyHecho; }
  guardarDB(); renderHoy(); toast('Día reiniciado');
};
$('btnFin').onclick = () => mostrarResumen();

/* ---------------- hábitos ---------------- */
function renderHabitos(){
  const h = (DB.days[S.fecha] && DB.days[S.fecha].hab) || {};
  const nut = calcNutri();
  $('habitos').innerHTML = HABITOS.map(x => `<button class="hab ${h[x.id] ? 'on' : ''}" data-hab="${x.id}">${h[x.id] ? '✓ ' : ''}${esc(x.t)}${x.id === 'prot' && nut ? ` · ${nut.prot} g` : ''}</button>`).join('');
}
$('habitos').addEventListener('click', ev => {
  const b = ev.target.closest('[data-hab]'); if(!b) return;
  const d = diaW(S.fecha); d.hab[b.dataset.hab] = !d.hab[b.dataset.hab];
  guardarDB(); renderHabitos();
});

/* ---------------- resumen de sesión ---------------- */
function mostrarResumen(){
  const f = S.fecha, p = progresoDia(f), d = DB.days[f] || {};
  if(!p.h){ toast('Aún no registras series en este día'); return; }
  pararDescanso();
  clearTimeout(toastT); $('toast').classList.remove('ver');
  if(!d.fin){ diaW(f).fin = Date.now(); guardarDB(); }
  const dd = DB.days[f];
  const min = dd.inicio ? Math.max(1, Math.round((dd.fin - dd.inicio)/60000)) : null;
  const vol = volumenDia(f), prs = prsDelDia(f), racha = calcRacha();
  $('celT').textContent = p.completo ? '¡Sesión completada!' : (p.hecho ? '¡Sesión cumplida!' : 'Sesión guardada');
  $('celX').innerHTML = `
    <div class="kpi">
      <div class="stat"><div class="v">${p.h}/${p.t}</div><div class="l">Series</div></div>
      <div class="stat"><div class="v">${min ?? '—'}</div><div class="l">Minutos</div></div>
      <div class="stat"><div class="v">${vol >= 1000 ? (vol/1000).toFixed(1) + ' t' : Math.round(vol) + ' kg'}</div><div class="l">Volumen</div></div>
    </div>
    ${prs.map(r => `<div class="pr">🏆 <b>Récord en ${esc(MAQ[r.m].n)}</b><br><span class="muted">Fuerza estimada (1RM): ${fmtKg(Math.round(r.hoy))} kg · antes ${fmtKg(Math.round(r.antes))} kg</span></div>`).join('')}
    <p class="muted" style="margin-top:14px">${p.hecho
      ? (racha > 1 ? `Llevas ${racha} días cumpliendo el plan. La consistencia es lo que protege tu músculo.` : 'Otra sesión que suma. El músculo se queda, la grasa se va.')
      : 'Sesión parcial guardada. Si la máquina estaba ocupada, usa el selector "¿Ocupada? Cambia" la próxima vez.'}</p>
    <div class="sec-mini">¿Qué tan dura fue?</div>
    <div class="habitos esf">${[['facil','Fácil'],['bien','Normal'],['duro','Muy dura']].map(([v, t]) => `<button class="hab ${dd.esfuerzo === v ? 'on' : ''}" data-esf="${v}">${t}</button>`).join('')}</div>`;
  $('celebra').classList.remove('hidden');
  if(p.hecho && DB.settings.feedback && navigator.vibrate) navigator.vibrate([60, 40, 60]);
  renderHoy();
}
$('celOk').onclick = () => $('celebra').classList.add('hidden');
$('celX').addEventListener('click', ev => {
  const b = ev.target.closest('[data-esf]'); if(!b) return;
  diaW(S.fecha).esfuerzo = b.dataset.esf; guardarDB();
  $('celX').querySelectorAll('[data-esf]').forEach(x => x.classList.toggle('on', x === b));
});
function textoResumen(f){
  const p = progresoDia(f), d = DB.days[f] || {};
  const min = d.inicio && d.fin ? Math.max(1, Math.round((d.fin - d.inicio)/60000)) : null;
  const vol = volumenDia(f);
  const prs = prsDelDia(f).map(r => `🏆 Récord en ${MAQ[r.m].n}: 1RM estimado ${Math.round(r.hoy)} kg`);
  return [`💪 ${p.rut.nombre} · ${fmtCorto(f)}`,
    `${p.h}/${p.t} series${min ? ` · ${min} min` : ''} · ${vol >= 1000 ? (vol/1000).toFixed(1) + ' t' : Math.round(vol) + ' kg'} levantados`,
    ...prs, `🔥 Racha: ${calcRacha()} días`].join('\n');
}
$('celShare').onclick = async () => {
  const txt = textoResumen(S.fecha);
  try{
    if(navigator.share){ await navigator.share({title: 'GymPlan', text: txt}); return; }
    await navigator.clipboard.writeText(txt); toast('Resumen copiado');
  }catch(e){ if(!(e && e.name === 'AbortError')) toast('No se pudo compartir'); }
};
$('notaSesion').addEventListener('change', ev => { diaW(S.fecha).nota = ev.target.value.trim(); guardarDB(); toast('Nota guardada'); });

/* ---------------- descanso, sonido y pantalla ---------------- */
let timerId = null, timerEnd = 0, audioCtx = null, wakeLock = null;
function asegurarAudio(){
  if(!DB.settings.feedback) return;
  try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
}
function iniciarDescanso(seg, sig, fin){
  timerEnd = fin || (Date.now() + seg*1000);
  $('descSig').textContent = sig || '';
  $('descanso').classList.remove('hidden');
  try{ localStorage.setItem('sfv4-descanso', JSON.stringify({fin: timerEnd, sig: sig || ''})); }catch(e){}
  clearInterval(timerId); timerId = setInterval(tickDescanso, 250); tickDescanso();
}
/* Si el teléfono cerró la app durante un descanso, lo retoma donde iba */
function restaurarDescanso(){
  try{
    const t = JSON.parse(localStorage.getItem('sfv4-descanso') || 'null');
    if(t && t.fin > Date.now() + 1000) iniciarDescanso(0, t.sig, t.fin);
    else localStorage.removeItem('sfv4-descanso');
  }catch(e){}
}
function tickDescanso(){
  const left = Math.max(0, Math.ceil((timerEnd - Date.now())/1000));
  $('descT').textContent = Math.floor(left/60) + ':' + pad(left % 60);
  if(left <= 0){
    clearInterval(timerId); timerId = null;
    try{ localStorage.removeItem('sfv4-descanso'); }catch(e){}
    avisarFinDescanso();
    setTimeout(() => { if(!timerId) $('descanso').classList.add('hidden'); }, 2500);
  }
}
function avisarFinDescanso(){
  toast('¡A la siguiente serie!');
  if(!DB.settings.feedback) return;
  if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
  try{
    if(!audioCtx) return;
    [0, .3].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.value = .18;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .18);
    });
  }catch(e){}
}
$('descMas').onclick = () => {
  timerEnd += 30000;
  try{ localStorage.setItem('sfv4-descanso', JSON.stringify({fin: timerEnd, sig: $('descSig').textContent})); }catch(e){}
  tickDescanso();
};
$('descFin').onclick = pararDescanso;

async function pedirPantalla(){
  if(!DB.settings.pantalla || !('wakeLock' in navigator) || wakeLock) return;
  try{ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }catch(e){}
}
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState !== 'visible') return;
  if(S.fecha === S.hoyAl && hoyISO() !== S.hoyAl){ S.fecha = S.hoyAl = hoyISO(); if(S.vista === 'hoy') renderHoy(); }   // pasó la medianoche
  const d = DB.days[hoyISO()];
  if(d && d.inicio && !d.fin) pedirPantalla();
  if(timerId) tickDescanso();
  if(S.vista === 'hoy') renderResumen();
});

/* ---------------- toast ---------------- */
let toastT;
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('ver');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('ver'), 2200);
}
