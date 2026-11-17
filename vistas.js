/* =====================================================================
   VISTAS: navegación, Plan, Progreso, Nutrición, Ciencia, Ajustes, arranque
   ===================================================================== */
function ir(v){
  S.vista = v;
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('activo', s.id === 'v-' + v));
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('activo', b.dataset.v === v));
  if(v !== 'hoy') document.documentElement.style.setProperty('--tema', '#FFD500');
  ({hoy:renderHoy, plan:renderPlan, progreso:renderProgreso, nutri:renderNutri, ciencia:renderCiencia, ajustes:renderAjustes})[v]();
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => ir(b.dataset.v));
$('btnAjustes').onclick = () => ir('ajustes');

/* ================= GRÁFICAS SVG ================= */
function svgLinea(pts, opt = {}){
  if(pts.length < 2) return `<p class="muted" style="margin-top:10px">${opt.vacio || 'Registra al menos dos datos para ver la gráfica.'}</p>`;
  const W = 330, H = 170, PL = 34, PR = 12, PT = 16, PB = 24;
  const ys = pts.map(p => p.y), min = Math.min(...ys), max = Math.max(...ys);
  const span = Math.max(max - min, opt.minSpan || 0), mid = (max + min)/2;   // escala mínima: no exagerar cambios pequeños
  const m = span*0.15 || Math.max(1, max*0.02), lo = mid - span/2 - m, hi = mid + span/2 + m;
  const X = i => PL + i*(W - PL - PR)/(pts.length - 1);
  const Y = v => H - PB - (v - lo)/(hi - lo)*(H - PT - PB);
  const linea = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  let media = '';
  if(opt.media && pts.length >= 3){
    const mm = pts.map((_, i) => { const sl = pts.slice(Math.max(0, i - 6), i + 1); return sl.reduce((a, b) => a + b.y, 0)/sl.length; });
    media = `<path d="${linea(mm)}" fill="none" stroke="#3ECF6E" stroke-width="2" stroke-dasharray="5 4"/>`;
  }
  const u = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opt.titulo || 'Gráfica')}">
    ${[hi - m, lo + m].map(v => `<line x1="${PL}" x2="${W - PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#2A2A33"/><text x="${PL - 6}" y="${(Y(v) + 3).toFixed(1)}" fill="#8E8E98" font-size="9.5" text-anchor="end">${fmtKg(Math.round(v*10)/10)}</text>`).join('')}
    <path d="${linea(ys)}" fill="none" stroke="#FFD500" stroke-width="2.5" stroke-linejoin="round"/>${media}
    ${pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.2" fill="#FFD500"/>`).join('')}
    <text x="${PL}" y="${H - 6}" fill="#8E8E98" font-size="9.5">${esc(pts[0].x)}</text>
    <text x="${W - PR}" y="${H - 6}" fill="#8E8E98" font-size="9.5" text-anchor="end">${esc(u.x)}</text>
    <text x="${X(pts.length - 1).toFixed(1)}" y="${(Y(u.y) - 8).toFixed(1)}" fill="#F2F2F0" font-size="11" font-weight="800" text-anchor="end">${fmtKg(Math.round(u.y*10)/10)}${opt.unidad || ''}</text>
  </svg>${media ? '<p class="muted">Línea verde: tendencia (promedio de los últimos registros).</p>' : ''}`;
}
function svgBarras(vals, etiquetas, meta){
  const W = 330, H = 130, P = 22, max = Math.max(meta || 0, ...vals, 1), bw = (W - 2*P)/vals.length;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Sesiones por semana">
    ${meta ? `<line x1="${P}" x2="${W - P}" y1="${(H - P - meta/max*(H - 2*P)).toFixed(1)}" y2="${(H - P - meta/max*(H - 2*P)).toFixed(1)}" stroke="#3ECF6E" stroke-dasharray="4 4"/>` : ''}
    ${vals.map((v, i) => { const h = v/max*(H - 2*P), x = P + i*bw + bw*0.18;
      return `<rect x="${x.toFixed(1)}" y="${(H - P - h).toFixed(1)}" width="${(bw*0.64).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" rx="4" fill="${meta && v >= meta ? '#3ECF6E' : '#FFD500'}"/>
        <text x="${(x + bw*0.32).toFixed(1)}" y="${(H - P - h - 4).toFixed(1)}" fill="#F2F2F0" font-size="10" text-anchor="middle">${v}</text>
        <text x="${(x + bw*0.32).toFixed(1)}" y="${H - 6}" fill="#8E8E98" font-size="9" text-anchor="middle">${esc(etiquetas[i])}</text>`; }).join('')}
  </svg>`;
}

/* ================= PLAN ================= */
function renderPlan(){
  const c = volumenSemanal();
  $('volumen').innerHTML = GRUPOS.map(({g, meta}) => {
    const n = c[g] || 0, color = !meta ? '#8E8E98' : (n >= 10 ? 'var(--ok)' : 'var(--warn)');
    return `<div class="vol-row"><span>${g}</span><div class="vol-bar"><i style="width:${Math.min(100, n/20*100)}%;background:${color}"></i></div><b>${fmtKg(n)}</b></div>`;
  }).join('') + `<p class="muted">Series semanales por grupo: una serie directa cuenta 1 y una indirecta 0,5 (por ejemplo, el chest press también trabaja tríceps). Rango orientativo para los grupos grandes: 10–20 (Schoenfeld et al., 2017).</p>`;
  $('planLista').innerHTML = PLAN.map(d => {
    const filas = slotsDe(d).map(s => {
      const mq = MAQ[s.m[0]], col = ZONAS[mq.zona].c;
      const presc = s.cardio ? `${s.min} min` : `${s.s} × ${s.r[0] === s.r[1] ? s.r[0] : s.r[0] + '–' + s.r[1]}`;
      return `<div class="row"><span><span class="zona-dot" style="display:inline-block;background:${col};margin-right:6px"></span>${/^\d+$/.test(mq.num) ? '<b>' + mq.num + '</b> ' : ''}${esc(mq.n)}${s.opc ? ' <span class="tag">opc.</span>' : ''}</span><span class="muted">${presc}</span></div>`;
    }).join('');
    return `<div class="card" style="border-left:4px solid ${ZONAS[d.tema].c}">
      <div class="nom">${esc(d.dia)} · ${esc(d.nombre)}</div>
      <div class="muted" style="margin:3px 0 8px">${esc(d.sub)}${d.descanso ? '' : ` · ~${duracionEstimada(d)} min`}</div>
      ${filas}
      <button class="btn" style="margin-top:10px;width:100%" data-dia="${d.id}">Ver este día</button></div>`;
  }).join('');
  $('planLista').querySelectorAll('[data-dia]').forEach(b => b.onclick = () => {
    const i = PLAN.findIndex(d => d.id === b.dataset.dia);
    S.fecha = iso(addDays(lunesDe(new Date()), i)); S.abiertas.clear(); ir('hoy');
  });
}

/* ================= PROGRESO ================= */
let metricaEj = 'e1rm', prellenado = false;

function renderProgreso(){
  const sm = semaforo();
  const lineas = [];
  if(sm.p) lineas.push(`Peso: ${sm.p.kgSem >= 0 ? '+' : ''}${sm.p.kgSem.toFixed(2)} kg/semana (${sm.p.pctSem >= 0 ? '+' : ''}${sm.p.pctSem.toFixed(2)} %)`);
  lineas.push(sm.fz ? `Fuerza en ejercicios principales: ${sm.fz.pct >= 0 ? '+' : ''}${sm.fz.pct.toFixed(1)} % (últimas 2 semanas vs. 3–6 semanas atrás)` : 'Fuerza: se mide tras ~3 semanas registrando kg y reps.');
  if(sm.cz) lineas.push(`Cintura: ${sm.cz.cm >= 0 ? '+' : ''}${fmtKg(sm.cz.cm)} cm en ${sm.cz.dias} días`);
  $('semaforo').className = 'card semaforo ' + sm.color;
  $('semaforo').innerHTML = `<div class="tit">${esc(sm.titulo)}</div><p class="muted" style="margin:6px 0">${esc(sm.txt)}</p>${lineas.map(l => `<div class="row"><span class="muted">${esc(l)}</span></div>`).join('')}<p class="muted" style="font-size:11px">Orientativo: combina báscula, cintura y fuerza. No es un diagnóstico.</p>`;

  $('revision').innerHTML = revisionHTML(hoyISO(), true);
  if(!$('mFecha').value) $('mFecha').value = hoyISO();
  if(!prellenado && DB.body.length){
    const u = DB.body[DB.body.length - 1];
    ['Peso:peso','Cintura:cintura','Cuello:cuello','Cadera:cadera','Pecho:pecho','Grasa:grasa'].forEach(p => { const [a, b] = p.split(':'); $('m' + a).value = u[b] ?? ''; });
    prellenado = true;
  }
  pintarCuerpo();
  $('listaMedidas').innerHTML = DB.body.slice(-6).reverse().map(b => {
    const c = composicion(b);
    const partes = [b.peso && b.peso + ' kg', b.cintura && 'cint. ' + b.cintura, b.cuello && 'cuello ' + b.cuello, b.cadera && 'cad. ' + b.cadera, b.pecho && 'pecho ' + b.pecho,
      c && fmtKg(Math.round(c.grasa*10)/10) + ' %' + (c.estimada ? ' est.' : '')];
    return `<div class="row"><span>${fmtCorto(b.f)}</span><span class="muted">${partes.filter(Boolean).join(' · ')}</span><button class="del" data-del="${b.f}" aria-label="Borrar registro">✕</button></div>`;
  }).join('');

  /* fuerza por máquina */
  const sel = $('selEj'), previo = sel.value;
  const conDatos = Object.keys(MAQ)
    .filter(id => MAQ[id].tipo !== 'cardio' && sesionesMaquina(id).some(s => cargaMax(s.sets) !== null))
    .map(id => ({id, n: sesionesMaquina(id).length, p: maquinasPrincipales().includes(id) ? 1 : 0}))
    .sort((a, b) => b.n - a.n || b.p - a.p)
    .map(x => x.id);
  sel.innerHTML = conDatos.length ? conDatos.map(id => `<option value="${id}">${esc(etiquetaNum(MAQ[id]))} · ${esc(MAQ[id].n)}</option>`).join('') : '<option value="">Registra series en Hoy para ver tu progreso</option>';
  if(previo && conDatos.includes(previo)) sel.value = previo;
  pintarEj();

  /* récords */
  const recs = conDatos.map(id => { let best = null, f = null; sesionesMaquina(id).forEach(s => { const v = mejorE1(s.sets); if(v && (!best || v > best)){ best = v; f = s.f; } }); return {id, best, f}; }).filter(r => r.best).sort((a, b) => b.best - a.best);
  $('records').innerHTML = recs.length ? recs.map(r => `<div class="row"><span><span class="zona-dot" style="display:inline-block;background:${ZONAS[MAQ[r.id].zona].c};margin-right:6px"></span>${esc(MAQ[r.id].n)}</span><span><b>${Math.round(r.best)} kg</b> <span class="muted">${fmtCorto(r.f)}</span></span></div>`).join('') : '<p class="muted">Aparecen cuando registras kg y reps.</p>';

  /* adherencia: sesiones por semana (8 semanas) y hábitos */
  const vals = [], et = [], lunHoy = lunesDe(new Date());
  for(let w = 7; w >= 0; w--){ const lun = addDays(lunHoy, -7*w); vals.push(statsSemana(iso(lun)).hechas); et.push(fmtCorto(iso(lun))); }
  let habOk = 0, habTot = 0;
  for(let i = 0; i < 7; i++){ const k = iso(addDays(lunHoy, i)); if(k > hoyISO()) break; const h = (DB.days[k] && DB.days[k].hab) || {}; HABITOS.forEach(x => { habTot++; if(h[x.id]) habOk++; }); }
  $('adherencia').innerHTML = svgBarras(vals, et, 5) + `<p class="muted">Sesiones cumplidas por semana (línea verde: 5). Hábitos de esta semana: <b>${habTot ? Math.round(habOk/habTot*100) : 0} %</b>.</p>`;
}

function pintarEj(){
  const id = $('selEj').value;
  document.querySelectorAll('#segEj button').forEach(b => b.classList.toggle('on', b.dataset.m === metricaEj));
  if(!id){ $('chartEj').innerHTML = ''; $('tablaEj').innerHTML = ''; return; }
  const ses = sesionesMaquina(id).reverse();
  const val = s => metricaEj === 'e1rm' ? mejorE1(s.sets) : metricaEj === 'carga' ? cargaMax(s.sets) : volumenSets(s.sets);
  const pts = ses.map(s => ({x: fmtCorto(s.f), y: val(s)})).filter(p => p.y);
  $('chartEj').innerHTML = svgLinea(pts, {unidad:' kg', minSpan: metricaEj === 'vol' ? 0 : 5, titulo:'Progreso por máquina', vacio: metricaEj === 'e1rm' ? 'La fuerza estimada necesita kg y reps en al menos dos sesiones.' : 'Necesitas al menos dos sesiones.'});
  $('tablaEj').innerHTML = ses.slice(-6).reverse().map(s => `<div class="row"><span>${fmtCorto(s.f)}</span><span class="muted">${s.sets.map(x => `${fmtKg(x.kg)}×${x.reps ?? '?'}`).join(' · ')}</span></div>`).join('');
}
$('selEj').onchange = pintarEj;

/* Gráfica del cuerpo: peso, cintura, % grasa y masa magra (estimados con el método Navy) */
let metricaCuerpo = 'peso';
function pintarCuerpo(){
  document.querySelectorAll('#segCuerpo button').forEach(b => b.classList.toggle('on', b.dataset.m === metricaCuerpo));
  const filas = DB.body.map(b => ({b, c: composicion(b)}));
  const r1 = v => Math.round(v*10)/10;
  const cfg = {
    peso:    {pts: filas.filter(x => x.b.peso).map(x => ({x: fmtCorto(x.b.f), y: x.b.peso})), opt: {media:true, unidad:' kg', minSpan:2, vacio:'Registra tu peso al menos dos veces para ver la gráfica.'}},
    cintura: {pts: filas.filter(x => x.b.cintura).map(x => ({x: fmtCorto(x.b.f), y: x.b.cintura})), opt: {unidad:' cm', minSpan:2, vacio:'Mide la cintura cada semana, a la altura del ombligo.'}},
    grasa:   {pts: filas.filter(x => x.c).map(x => ({x: fmtCorto(x.b.f), y: r1(x.c.grasa)})), opt: {unidad:' %', minSpan:2, vacio: num(DB.nutri.altura) ? 'Registra cintura y cuello (y cadera si eres mujer) en dos fechas para ver la tendencia.' : 'Agrega tu altura en Nutrición y registra cintura y cuello.'}},
    magra:   {pts: filas.filter(x => x.c).map(x => ({x: fmtCorto(x.b.f), y: r1(x.c.magra)})), opt: {unidad:' kg', minSpan:2, vacio:'Necesita peso, cintura, cuello y tu altura en dos fechas.'}}
  }[metricaCuerpo];
  $('chartCuerpo').innerHTML = svgLinea(cfg.pts, cfg.opt) + (metricaCuerpo === 'grasa' || metricaCuerpo === 'magra'
    ? '<p class="muted" style="font-size:11px">Estimación por perímetros (método Navy): puede errar varios puntos, pero la tendencia es útil. Si la masa magra se mantiene mientras baja el peso, estás perdiendo grasa.</p>' : '');
  const ult = [...filas].reverse().find(x => x.c);
  $('kpiComp').innerHTML = ult ? `
    <div class="stat"><div class="v">${fmtKg(r1(ult.c.grasa))}%</div><div class="l">Grasa${ult.c.estimada ? ' est.' : ''}</div></div>
    <div class="stat"><div class="v">${fmtKg(r1(ult.c.magra))}</div><div class="l">Magra (kg)</div></div>
    <div class="stat"><div class="v">${fmtKg(r1(ult.c.grasaKg))}</div><div class="l">Grasa (kg)</div></div>` : '';
}
document.querySelectorAll('#segCuerpo button').forEach(b => b.onclick = () => { metricaCuerpo = b.dataset.m; pintarCuerpo(); });

/* Respaldo: menú de compartir del teléfono (Drive, WhatsApp, correo) o descarga */
async function compartirRespaldo(){
  const nombre = 'gymplan-respaldo-' + hoyISO() + '.json';
  const blob = new Blob([JSON.stringify(DB, null, 2)], {type:'application/json'});
  const marcar = msg => { DB.settings.ultimoRespaldo = hoyISO(); guardarDB(); toast(msg); if(S.vista === 'hoy') renderAvisos(); };
  try{
    const file = new File([blob], nombre, {type:'application/json'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:'Respaldo GymPlan'});
      marcar('Respaldo compartido'); return;
    }
  }catch(e){ if(e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  marcar('Respaldo descargado');
}
document.querySelectorAll('#segEj button').forEach(b => b.onclick = () => { metricaEj = b.dataset.m; pintarEj(); });

$('mGuardar').onclick = () => {
  const f = $('mFecha').value || hoyISO();
  const e = {f, peso:num($('mPeso').value), cintura:num($('mCintura').value), cuello:num($('mCuello').value), cadera:num($('mCadera').value), pecho:num($('mPecho').value), grasa:num($('mGrasa').value)};
  Object.keys(e).forEach(k => { if(e[k] === null) delete e[k]; });
  if(Object.keys(e).length === 1){ toast('Escribe al menos una medida'); return; }
  if(e.peso && (e.peso < 30 || e.peso > 300)){ toast('Revisa el peso: parece fuera de rango'); return; }
  DB.body = DB.body.filter(b => b.f !== f); DB.body.push(e); DB.body.sort((a, b) => a.f.localeCompare(b.f));
  if(e.peso){ DB.nutri.peso = e.peso; }
  guardarDB(); toast('Medidas guardadas'); renderProgreso();
};
$('listaMedidas').addEventListener('click', ev => {
  const b = ev.target.closest('[data-del]'); if(!b) return;
  if(!confirm('¿Borrar el registro del ' + fmtCorto(b.dataset.del) + '?')) return;
  DB.body = DB.body.filter(x => x.f !== b.dataset.del); guardarDB(); renderProgreso();
});

/* ================= NUTRICIÓN ================= */
const NUTRI_IDS = {nSexo:'sexo', nEdad:'edad', nAltura:'altura', nPeso:'peso', nAct:'act', nObj:'obj'};
function renderNutri(){
  const n = DB.nutri;
  if(!n.peso){ const u = [...DB.body].reverse().find(b => b.peso); if(u) n.peso = u.peso; }
  Object.entries(NUTRI_IDS).forEach(([id, k]) => { if(document.activeElement !== $(id)) $(id).value = n[k] ?? ''; });
  const r = calcNutri();
  if(!r){ $('nutriRes').innerHTML = '<div class="card"><p class="muted">Completa edad, altura y peso para calcular tus calorías y tu proteína.</p></div>'; return; }
  const minF = n.sexo === 'h' ? 1500 : 1200;
  $('nutriRes').innerHTML = `
    <div class="kpi">
      <div class="stat"><div class="v">${r.get}</div><div class="l">Gasto diario</div></div>
      <div class="stat"><div class="v" style="color:var(--sf)">${r.kcal}</div><div class="l">Tu objetivo</div></div>
      <div class="stat"><div class="v">${r.ajuste > 0 ? '+' : ''}${r.ajuste}</div><div class="l">Ajuste kcal</div></div>
    </div>
    <div class="card">
      <div class="row"><span><b>Proteína</b></span><span><b>${r.prot} g</b> <span class="muted">(${r.protMin}–${r.protMax})</span></span></div>
      <div class="row"><span>Grasa</span><b>${r.grasa} g</b></div>
      <div class="row"><span>Carbohidratos</span><b>${r.carbs} g</b></div>
      <div class="row"><span>Proteína por comida (4 comidas)</span><b>~${Math.round(r.prot/4)} g</b></div>
    </div>
    ${r.kcal < minF ? `<div class="aviso"><b>Objetivo por debajo de ${minF} kcal.</b> Es poco para entrenar fuerte y conservar músculo. Reduce el déficit o consulta a un profesional.</div>` : ''}
    <div class="sec-t">Ideas de 30–45 g de proteína</div>
    <div class="card">${PROTE_EJEMPLOS.map(t => `<div class="row"><span class="muted">${esc(t)}</span></div>`).join('')}<p class="muted" style="font-size:11px">Valores aproximados; cambian según la marca y la preparación.</p></div>
    <div class="card"><p class="muted">Cálculo con la ecuación de Mifflin-St Jeor y tu nivel de actividad. El déficit apunta a perder ~0,5 % de tu peso por semana, un ritmo que protege la masa muscular. Son estimaciones: ajusta con lo que muestre tu semáforo en Progreso después de 2–3 semanas.</p></div>`;
}
Object.keys(NUTRI_IDS).forEach(id => $(id).addEventListener('input', () => { DB.nutri[NUTRI_IDS[id]] = $(id).value; guardarDB(); renderNutri(); }));

/* ================= CIENCIA ================= */
function renderCiencia(){
  const cats = [...new Set(TIPS.map(t => t.c))];
  $('tipsLista').innerHTML = cats.map(c => `<div class="sec-mini">${esc(c)}</div>` + TIPS.filter(t => t.c === c).map(t => `<div class="tip-item">${esc(t.t)}</div>`).join('')).join('');
}

/* ================= AJUSTES ================= */
function renderAjustes(){
  $('sDumb').checked = !!DB.settings.dumbbells;
  $('sFeed').checked = !!DB.settings.feedback;
  $('sPant').checked = !!DB.settings.pantalla;
  $('sDesc').checked = !!DB.settings.descarga;
  $('sInc').value = String(DB.settings.incremento);
  $('sInicio').value = DB.settings.inicio || '';
  const n = semanaPlan(hoyISO());
  $('semActual').textContent = n ? `Hoy estás en la semana ${n} del plan${esDescarga(hoyISO()) ? ' (descarga)' : ''}. Próxima descarga: semana ${Math.ceil(n/6)*6 === n ? n + 6 : Math.ceil(n/6)*6}.` : 'Define la fecha de inicio para calcular las semanas de descarga.';
}
const ajusteBool = (id, k, msg) => $(id).onchange = () => { DB.settings[k] = $(id).checked; guardarDB(); if(msg) toast(msg($(id).checked)); renderAjustes(); };
ajusteBool('sDumb', 'dumbbells', on => on ? 'Las mancuernas aparecen como alternativa' : 'Solo máquinas y poleas');
ajusteBool('sFeed', 'feedback');
ajusteBool('sPant', 'pantalla');
ajusteBool('sDesc', 'descarga');
$('sInc').onchange = () => { DB.settings.incremento = num($('sInc').value) || 2.5; guardarDB(); toast('Incremento guardado'); };
$('sInicio').onchange = () => { if($('sInicio').value){ DB.settings.inicio = $('sInicio').value; guardarDB(); renderAjustes(); } };

$('btnExport').onclick = () => compartirRespaldo();
$('btnImport').onclick = () => $('fileImport').click();
$('fileImport').onchange = async ev => {
  const file = ev.target.files[0]; if(!file) return;
  try{
    const j = JSON.parse(await file.text());
    if(!j || typeof j.days !== 'object') throw new Error('formato');
    if(!confirm('Esto reemplaza los datos actuales de este teléfono por los del respaldo. ¿Continuar?')) return;
    DB = j.v === 4 ? normalizarDB(j) : migrarV3(j);
    guardarDB(); prellenado = false; toast('Respaldo restaurado'); ir('hoy');
  }catch(e){ toast('Ese archivo no es un respaldo válido'); }
  finally{ ev.target.value = ''; }
};
$('btnBorrar').onclick = () => {
  if(!confirm('¿Borrar TODO tu progreso de este teléfono? Exporta un respaldo antes.')) return;
  if(!confirm('Última confirmación: esta acción no se puede deshacer.')) return;
  DB = nuevoDB(); guardarDB(); prellenado = false; toast('Progreso borrado'); ir('hoy');
};

/* ================= ARRANQUE ================= */
const APP_VERSION = '5.1.0';
let fraseIdx = Math.floor(Math.random()*FRASES.length);
function pintarFrase(){
  const q = FRASES[fraseIdx % FRASES.length];
  $('frase').textContent = '“' + q.f + '”';
  $('autor').textContent = q.a ? '— ' + q.a : '';
}
function arrancar(){
  const migrado = cargarDB();
  $('versionTxt').textContent = 'GymPlan · versión ' + APP_VERSION;
  pintarFrase();
  setInterval(() => { fraseIdx++; $('frase').style.opacity = 0; setTimeout(() => { pintarFrase(); $('frase').style.opacity = 1; }, 300); }, 30000);
  setInterval(() => { if(S.vista === 'hoy') pintarReloj(); }, 30000);
  ir('hoy');
  restaurarDescanso();
  if(migrado) setTimeout(() => toast('Importé tu progreso de la versión anterior'), 600);
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  registrarSW();
}
function registrarSW(){
  if(!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const aviso = w => { $('banner').classList.remove('hidden'); $('btnActualizar').onclick = () => w.postMessage({type:'SKIP_WAITING'}); };
    if(reg.waiting && navigator.serviceWorker.controller) aviso(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if(nw) nw.addEventListener('statechange', () => { if(nw.state === 'installed' && navigator.serviceWorker.controller) aviso(nw); });
    });
    setInterval(() => reg.update().catch(() => {}), 60*60*1000);
  }).catch(() => {});
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if(!recargando){ recargando = true; location.reload(); } });
}
arrancar();
