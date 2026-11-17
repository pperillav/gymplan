/* =====================================================================
   NÚCLEO: utilidades, almacenamiento, migraciones y cálculos
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseIso = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 12); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const lunesDe = d => { const x = new Date(d); x.setHours(12,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
const hoyISO = () => iso(new Date());
const diaSemana = f => (parseIso(f).getDay()+6)%7;
const difDias = (a,b) => Math.round((parseIso(a)-parseIso(b))/864e5);
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fmtCorto = s => s.slice(8,10)+'/'+s.slice(5,7);
const fmtLargo = f => { const d = parseIso(f); return d.getDate()+' '+MESES[d.getMonth()]; };
const fmtSeg = s => s>=60 ? Math.floor(s/60)+':'+pad(s%60)+' min' : s+' s';
const num = v => { if(v===null || v===undefined || v==='') return null; const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? null : n; };
const fmtKg = v => (v===null || v===undefined || isNaN(v)) ? '—' : String(Math.round(v*100)/100);
const redondear = (x, inc) => Math.max(0, Math.round(x/inc)*inc);

/* ================= ALMACENAMIENTO ================= */
const LS_KEY = 'sfv4';
const DEF_SETTINGS = {dumbbells:false, feedback:true, pantalla:true, descarga:true, incremento:2.5, inicio:null, onboard:false};
const DEF_NUTRI = {sexo:'h', edad:'', altura:'', peso:'', act:'lig', obj:'perder'};

function nuevoDB(){
  return {v:4, settings:{...DEF_SETTINGS, inicio: iso(lunesDe(new Date()))}, days:{}, body:[], nutri:{...DEF_NUTRI}, pref:{}, maq:{}};
}
let DB = nuevoDB();

function normalizarDB(j){
  const base = nuevoDB();
  const db = {
    v:4,
    settings: {...base.settings, ...(j.settings||{})},
    days: (j.days && typeof j.days === 'object') ? j.days : {},
    body: Array.isArray(j.body) ? j.body.filter(b => b && typeof b.f === 'string') : [],
    nutri: {...DEF_NUTRI, ...(j.nutri||{})},
    pref: (j.pref && typeof j.pref === 'object') ? j.pref : {},
    maq: (j.maq && typeof j.maq === 'object') ? j.maq : {}
  };
  db.body.sort((a,b) => a.f.localeCompare(b.f));
  return db;
}

/* Devuelve 'v3', 'v1' o null según si importó datos de una versión anterior */
function cargarDB(){
  let migrado = null;
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ DB = normalizarDB(JSON.parse(raw)); return null; }
    const v3 = localStorage.getItem('sfv3');
    if(v3){ DB = migrarV3(JSON.parse(v3)); migrado = 'v3'; }
    else if(Object.keys(localStorage).some(k => k.startsWith('sf-log:'))){ DB = migrarV1(); migrado = 'v1'; }
    else DB = nuevoDB();
    guardarDB();
  }catch(e){ console.error(e); DB = nuevoDB(); }
  return migrado;
}

function guardarDB(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(DB)); return true; }
  catch(e){ if(typeof toast === 'function') toast('No se pudo guardar. Exporta tus datos en Ajustes.'); return false; }
}

/* ---------- migraciones (no se pierde el progreso de versiones anteriores) ---------- */
function marcarLegacy(db, f, log){
  const rut = PLAN[diaSemana(f)];
  const req = rut.bloques.flatMap(b => b.slots).filter(s => !s.opc).length;
  const ok = Object.values(log).filter(l => l.sets.every(x => x.ok)).length;
  if(req && ok >= Math.ceil(req*0.8)) db.days[f].legacyHecho = true;
}

function migrarV3(j){
  const db = nuevoDB();
  const st = j.settings || {};
  db.settings.dumbbells = !!st.dumbbells;
  db.settings.feedback = st.feedback !== false;
  if(st.incremento) db.settings.incremento = st.incremento;
  db.body = Array.isArray(j.body) ? j.body.filter(b => b && b.f).sort((a,b) => a.f.localeCompare(b.f)) : [];
  db.nutri = {...DEF_NUTRI, ...(j.nutri||{})};
  let primera = null;
  Object.entries(j.days || {}).forEach(([f, d]) => {
    const log = {};
    const ids = new Set([...Object.keys(d.sets||{}), ...Object.keys(d.pesos||{})]);
    ids.forEach(id => {
      const m = LEGACY[id]; if(!m || !MAQ[m]) return;
      const arr = (d.sets||{})[id] || [];
      const kg = (d.pesos||{})[id] ?? null;
      if(!arr.some(Boolean) && kg === null) return;
      if(MAQ[m].tipo === 'cardio') log[id] = {m, sets:[{ok:!!arr[0]}]};
      else log[id] = {m, sets: arr.length ? arr.map(b => ({kg, reps:null, ok:!!b})) : [{kg, reps:null, ok:false}]};
    });
    if(Object.keys(log).length){
      db.days[f] = {log};
      marcarLegacy(db, f, log);
      if(!primera || f < primera) primera = f;
    }
  });
  if(primera) db.settings.inicio = iso(lunesDe(parseIso(primera)));
  return db;
}

function migrarV1(){
  const db = nuevoDB();
  let primera = null;
  Object.keys(localStorage).forEach(key => {
    if(!key.startsWith('sf-log:')) return;
    try{
      const [, lun, dayId] = key.split(':');
      const i = parseInt(dayId.slice(1), 10) - 1;
      if(!(i >= 0 && i <= 6)) return;
      const st = JSON.parse(localStorage.getItem(key)) || {};
      const f = iso(addDays(parseIso(lun), i));
      const log = {};
      const ids = new Set([...Object.keys(st.done||{}), ...Object.keys(st.pesos||{})]);
      ids.forEach(id => {
        const m = LEGACY[id]; if(!m || !MAQ[m]) return;
        const ok = !!(st.done||{})[id];
        const kg = (st.pesos||{})[id] ?? null;
        if(!ok && kg === null) return;
        const n = (SLOT[id] && !SLOT[id].slot.cardio) ? SLOT[id].slot.s : 3;
        log[id] = MAQ[m].tipo === 'cardio' ? {m, sets:[{ok}]} : {m, sets: Array.from({length:n}, () => ({kg, reps:null, ok}))};
      });
      if(Object.keys(log).length){
        db.days[f] = {log};
        marcarLegacy(db, f, log);
        if(!primera || f < primera) primera = f;
      }
    }catch(e){ /* clave dañada: se ignora */ }
  });
  if(primera) db.settings.inicio = iso(lunesDe(parseIso(primera)));
  return db;
}

/* ================= PLAN Y DÍAS ================= */
const slotsDe = rut => rut.bloques.flatMap(b => b.slots);
function rutinaDe(f){ const o = DB.days[f] && DB.days[f].rutina; return (o && RUTINA[o]) || PLAN[diaSemana(f)]; }
function semanaPlan(f){
  const ini = DB.settings.inicio; if(!ini) return null;
  const n = Math.floor(difDias(f, ini)/7) + 1;
  return n >= 1 ? n : null;
}
function esDescarga(f){ const n = semanaPlan(f); return !!(DB.settings.descarga && n && n % 6 === 0); }
function seriesDe(slot, f){ if(slot.cardio) return 1; return esDescarga(f) ? Math.max(1, Math.ceil(slot.s/2)) : slot.s; }
function disponibles(slot){ return slot.m.filter(id => MAQ[id] && (DB.settings.dumbbells || MAQ[id].tipo !== 'mancuerna')); }
function logDe(f, slotId){ const d = DB.days[f]; return d && d.log && d.log[slotId]; }
function maquinaDe(slot, f){
  const l = logDe(f, slot.id);
  if(l && l.m && MAQ[l.m]) return l.m;
  const disp = disponibles(slot);
  const p = DB.pref[slot.id];
  if(p && disp.includes(p)) return p;
  return disp[0] || slot.m[0];
}
function diaW(f){ const d = DB.days[f] || (DB.days[f] = {}); d.log = d.log || {}; d.hab = d.hab || {}; return d; }
function logW(f, slot){
  const d = diaW(f);
  if(!d.log[slot.id]) d.log[slot.id] = {m: maquinaDe(slot, f), sets: []};
  if(!Array.isArray(d.log[slot.id].sets)) d.log[slot.id].sets = [];
  return d.log[slot.id];
}

/* Una sesión cuenta como cumplida con ≥80 % de las series obligatorias */
function progresoDia(f){
  const rut = rutinaDe(f);
  const d = DB.days[f] || {};
  if(rut.descanso) return {h:0, t:0, hecho:false, completo:false, descanso:true, rut};
  let h = 0, t = 0;
  slotsDe(rut).forEach(s => {
    if(s.opc) return;
    const n = seriesDe(s, f); t += n;
    const l = d.log && d.log[s.id];
    if(l && Array.isArray(l.sets)) h += Math.min(n, l.sets.slice(0, n).filter(x => x && x.ok).length);
  });
  const hecho = (t > 0 && h/t >= 0.8) || !!d.legacyHecho;
  return {h, t, hecho, completo: t > 0 && h >= t, descanso:false, rut};
}

function calcRacha(){
  let r = 0, f = hoyISO();
  for(let i = 0; i < 500; i++){
    const p = progresoDia(f);
    const prev = iso(addDays(parseIso(f), -1));
    if(p.descanso){ f = prev; continue; }
    if(!p.hecho){ if(i === 0){ f = prev; continue; } break; }
    r++; f = prev;
  }
  return r;
}
function statsSemana(f){
  const lun = lunesDe(parseIso(f));
  let plan = 0, hechas = 0;
  for(let i = 0; i < 7; i++){
    const p = progresoDia(iso(addDays(lun, i)));
    if(!p.descanso){ plan++; if(p.hecho) hechas++; }
  }
  return {plan, hechas};
}
function totalSesiones(){ return Object.keys(DB.days).filter(k => { const p = progresoDia(k); return !p.descanso && p.hecho; }).length; }

/* ================= HISTORIAL, PROGRESIÓN Y RÉCORDS ================= */
/* Sesiones de una máquina. Con slotId: solo las de ese ejercicio (mismo rango de reps). */
function sesionesMaquina(mid, antesDe, slotId){
  const out = [];
  Object.keys(DB.days).sort().reverse().forEach(f => {
    if(antesDe && f >= antesDe) return;
    const log = DB.days[f].log || {};
    let sets = [];
    Object.entries(log).forEach(([sid, l]) => {
      if(slotId && sid !== slotId) return;
      if(l && l.m === mid && Array.isArray(l.sets)) sets = sets.concat(l.sets.filter(x => x && x.ok));
    });
    if(sets.length) out.push({f, sets});
  });
  return out;
}
const e1rm = (kg, reps) => (kg > 0 && reps > 0) ? kg * (1 + reps/30) : null;   // Epley
function mejorE1(sets){ let b = null; sets.forEach(x => { const v = e1rm(x.kg, x.reps); if(v && (b === null || v > b)) b = v; }); return b; }
function cargaMax(sets){ let b = null; sets.forEach(x => { if(x.kg > 0 && (b === null || x.kg > b)) b = x.kg; }); return b; }
const volumenSets = sets => sets.reduce((a,x) => a + ((x.kg > 0 && x.reps > 0) ? x.kg*x.reps : 0), 0);
function incDe(mid){ const v = DB.maq[mid] && DB.maq[mid].inc; return num(v) || DB.settings.incremento || 2.5; }

/* Progresión doble: sube cuando llegas al tope del rango en todas las series */
function sugerir(slot, mid, f){
  const [lo, hi] = slot.r;
  const inc = incDe(mid);
  const hist = sesionesMaquina(mid, f, slot.id);   // mismo ejercicio = mismo rango de reps
  if(!hist.length){
    // ¿Usaste esta máquina en otro día con otro rango? Estimar con el 1RM (Epley inverso)
    const otra = sesionesMaquina(mid, f);
    const e1 = otra.length ? mejorE1(otra[0].sets) : null;
    if(e1){
      const kg = Math.max(inc, Math.floor(e1/(1 + ((lo + hi)/2 + slot.rir)/30)/inc)*inc);   // redondeo conservador
      return {kg, prev:[], tipo:'nuevo', txt:`Estimado desde tu sesión del ${fmtCorto(otra[0].f)} en esta máquina (otro rango de reps): empieza con ${fmtKg(kg)} kg y ajusta para hacer ${lo}–${hi} reps con ~${slot.rir} en reserva.`};
    }
    return {kg:null, prev:[], tipo:'nuevo',
      txt:`Primera vez en esta máquina: elige una carga con la que completes ${lo}–${hi} reps dejando ~${slot.rir} en reserva. Mejor empezar conservador.`};
  }
  const last = hist[0];
  const ref = cargaMax(last.sets);
  const prev = last.sets.map(x => x.reps);
  if(ref === null) return {kg:null, prev, tipo:'nuevo', txt:'Registra carga y repeticiones para recibir sugerencias.'};
  if(esDescarga(f)) return {kg:ref, prev, tipo:'descarga', txt:`Semana de descarga: ${fmtKg(ref)} kg, la mitad de las series y lejos del fallo (RIR 3–4).`};
  const conReps = last.sets.filter(x => x.reps > 0);
  if(!conReps.length) return {kg:ref, prev, tipo:'mantener', txt:`Última vez: ${fmtKg(ref)} kg. Registra tus repeticiones para que la app calcule cuándo subir.`};
  const trabajo = last.sets.filter(x => x.kg === ref && x.reps > 0);
  const todasTope = trabajo.length >= Math.ceil(slot.s*0.75) && trabajo.every(x => x.reps >= hi);
  if(todasTope){
    const kg = ref + inc;
    return {kg, prev:[], tipo:'subir', txt:`¡Toca subir! Hiciste ${hi}+ reps en todas las series con ${fmtKg(ref)} kg. Hoy: ${fmtKg(kg)} kg y apunta a ${lo} reps o más.`};
  }
  if(conReps.some(x => x.reps < lo)){
    const ant = hist[1];
    const antBajo = ant && ant.sets.some(x => x.reps > 0 && x.reps < lo) && (cargaMax(ant.sets) || 0) >= ref;
    if(antBajo){
      const kg = redondear(ref*0.9, inc);
      return {kg, prev:[], tipo:'bajar', txt:`Dos sesiones por debajo de ${lo} reps: baja a ${fmtKg(kg)} kg y vuelve a construir. Revisa sueño y comida.`};
    }
    return {kg:ref, prev, tipo:'mantener', txt:`Repite ${fmtKg(ref)} kg y busca ${lo} reps en todas las series.`};
  }
  return {kg:ref, prev, tipo:'mantener', txt:`Mantén ${fmtKg(ref)} kg y suma 1 rep donde puedas. Meta: ${hi} reps en todas las series.`};
}

function calentamiento(kg, mid){
  if(!kg) return 'Calentamiento: 1–2 series ligeras de 10–12 reps antes de la primera serie efectiva.';
  const inc = incDe(mid);
  return `Calentamiento: ${fmtKg(redondear(kg*0.5, inc))} kg × 10 · ${fmtKg(redondear(kg*0.75, inc))} kg × 4, sin fatigarte.`;
}

function prsDelDia(f){
  const out = [], vistos = new Set();
  const log = (DB.days[f] && DB.days[f].log) || {};
  Object.values(log).forEach(l => {
    if(!l || !l.m || !MAQ[l.m] || vistos.has(l.m) || MAQ[l.m].tipo === 'cardio') return;
    vistos.add(l.m);
    const hoy = mejorE1(sesionesMaquina(l.m).filter(s => s.f === f).flatMap(s => s.sets));
    const antes = mejorE1(sesionesMaquina(l.m, f).flatMap(s => s.sets));
    if(hoy && antes && hoy > antes*1.005) out.push({m:l.m, hoy, antes});
  });
  return out;
}
function volumenDia(f){
  let v = 0;
  const log = (DB.days[f] && DB.days[f].log) || {};
  Object.values(log).forEach(l => { if(l && Array.isArray(l.sets)) v += volumenSets(l.sets.filter(x => x && x.ok)); });
  return v;
}

/* ================= TENDENCIAS Y SEMÁFORO DE RECOMPOSICIÓN ================= */
function regresion(pts){
  const n = pts.length; if(n < 2) return null;
  const mx = pts.reduce((a,p) => a+p.x, 0)/n, my = pts.reduce((a,p) => a+p.y, 0)/n;
  let sxy = 0, sxx = 0;
  pts.forEach(p => { sxy += (p.x-mx)*(p.y-my); sxx += (p.x-mx)**2; });
  return sxx ? {pend: sxy/sxx, media: my} : null;
}
function tendenciaPeso(){
  const hoy = hoyISO();
  const pts = DB.body.filter(b => b.peso && difDias(hoy, b.f) >= 0 && difDias(hoy, b.f) <= 28).map(b => ({x: -difDias(hoy, b.f), y: b.peso}));
  if(pts.length < 3) return null;
  const xs = pts.map(p => p.x);
  if(Math.max(...xs) - Math.min(...xs) < 7) return null;
  const r = regresion(pts); if(!r) return null;
  const kgSem = r.pend*7;
  return {kgSem, pctSem: kgSem/r.media*100, n: pts.length};
}
function maquinasPrincipales(){
  const s = new Set();
  PLAN.forEach(d => slotsDe(d).forEach(x => { if(x.principal) x.m.forEach(m => s.add(m)); }));
  return [...s];
}
function tendenciaFuerza(){
  const hoy = hoyISO(), cambios = [];
  maquinasPrincipales().forEach(mid => {
    const ses = sesionesMaquina(mid);
    const rec = mejorE1(ses.filter(s => difDias(hoy, s.f) <= 14).flatMap(s => s.sets));
    const ant = mejorE1(ses.filter(s => { const d = difDias(hoy, s.f); return d > 14 && d <= 42; }).flatMap(s => s.sets));
    if(rec && ant) cambios.push((rec-ant)/ant*100);
  });
  if(!cambios.length) return null;
  return {pct: cambios.reduce((a,b) => a+b, 0)/cambios.length, n: cambios.length};
}
function cambioCintura(){
  const c = DB.body.filter(b => b.cintura);
  if(c.length < 2) return null;
  const u = c[c.length-1];
  const ref = [...c].reverse().find(b => difDias(u.f, b.f) >= 21) || c[0];
  if(ref === u) return null;
  return {cm: u.cintura - ref.cintura, dias: difDias(u.f, ref.f)};
}
function semaforo(){
  const p = tendenciaPeso(), fz = tendenciaFuerza(), cz = cambioCintura();
  const base = {p, fz, cz};
  if(!p) return {...base, color:'gris', titulo:'Faltan datos de peso', txt:'Registra tu peso 3 o más veces repartidas en al menos una semana para ver tu tendencia.'};
  const r = p.pctSem, fuerzaCae = fz && fz.pct < -3;
  if(r < -1) return fuerzaCae
    ? {...base, color:'rojo', titulo:'Riesgo de perder músculo', txt:'Bajas rápido y tu fuerza cae. Sube 150–250 kcal, sobre todo carbohidratos alrededor del entrenamiento, y prioriza el sueño.'}
    : {...base, color:'ambar', titulo:'Ritmo de pérdida alto', txt:'Bajas más de 1 % de tu peso por semana. Vigila la fuerza: si empieza a caer, sube calorías.'};
  if(r <= -0.25) return fuerzaCae
    ? {...base, color:'ambar', titulo:'Buen ritmo, pero la fuerza cae', txt:'Revisa proteína, sueño y descansos entre series. Si sigue cayendo, adelanta la semana de descarga.'}
    : {...base, color:'verde', titulo:'Vas muy bien', txt:'Pierdes peso a un ritmo que protege el músculo' + (fz ? ' y tu fuerza se mantiene.' : '. Registra tus repeticiones para medir también la fuerza.')};
  if(r < 0.25){
    if(cz && cz.cm <= -1 && (!fz || fz.pct >= 0)) return {...base, color:'verde', titulo:'Recomposición en marcha', txt:'Peso estable, cintura bajando y fuerza estable o subiendo: estás cambiando grasa por músculo.'};
    return {...base, color:'ambar', titulo:'Peso estable', txt:'Si tu objetivo es perder grasa, reduce ~150–200 kcal al día o suma 2 000 pasos diarios.'};
  }
  return {...base, color:'ambar', titulo:'Estás subiendo de peso', txt:'Si tu objetivo es perder grasa, reduce ~200 kcal al día y revisa la cintura.'};
}

/* ================= VOLUMEN Y DURACIÓN ================= */
function volumenSemanal(){
  const c = {};
  PLAN.forEach(d => slotsDe(d).forEach(s => {
    if(s.opc || s.cardio) return;
    const mq = MAQ[s.m[0]]; if(!mq) return;
    Object.entries(mq.g || {}).forEach(([g, f]) => { c[g] = (c[g] || 0) + s.s*f; });
  }));
  return c;
}
function duracionEstimada(rut){
  let seg = 0;
  slotsDe(rut).forEach(s => {
    if(s.opc) return;
    if(s.cardio){ seg += (s.min || 10)*60; return; }
    seg += s.s*(40 + s.rest) + (s.principal ? 180 : 0);
  });
  return Math.max(5, Math.round(seg/60/5)*5);
}

/* ================= NUTRICIÓN ================= */
function calcNutri(){
  const n = DB.nutri;
  const peso = num(n.peso), altura = num(n.altura), edad = num(n.edad);
  if(!(peso > 0 && altura > 0 && edad > 0)) return null;
  const tmb = 10*peso + 6.25*altura - 5*edad + (n.sexo === 'h' ? 5 : -161);   // Mifflin-St Jeor
  const fac = {sed:1.2, lig:1.375, mod:1.55, act:1.725}[n.act] || 1.375;
  const get = tmb*fac;
  let ajuste = 0;
  if(n.obj === 'perder') ajuste = -Math.min(500, Math.max(250, Math.round(peso*0.005*7700/7/10)*10));   // ≈0.5 % del peso por semana
  if(n.obj === 'ganar') ajuste = 250;
  const kcal = Math.round((get + ajuste)/10)*10;
  const prot = Math.round(2.0*peso), grasa = Math.round(0.8*peso);
  const carbs = Math.max(0, Math.round((kcal - prot*4 - grasa*9)/4));
  return {tmb:Math.round(tmb), get:Math.round(get), kcal, ajuste, prot, protMin:Math.round(1.8*peso), protMax:Math.round(2.2*peso), grasa, carbs, peso};
}

/* ================= COMPOSICIÓN CORPORAL (método Navy, Hodgdon y Beckett 1984) ================= */
function grasaNavy(b){
  const h = num(DB.nutri.altura);
  if(!(h > 0 && b && b.cintura > 0 && b.cuello > 0)) return null;
  let v;
  if(DB.nutri.sexo === 'm'){
    if(!(b.cadera > 0) || b.cintura + b.cadera - b.cuello <= 0) return null;
    v = 495/(1.29579 - 0.35004*Math.log10(b.cintura + b.cadera - b.cuello) + 0.22100*Math.log10(h)) - 450;
  } else {
    if(b.cintura - b.cuello <= 0) return null;
    v = 495/(1.0324 - 0.19077*Math.log10(b.cintura - b.cuello) + 0.15456*Math.log10(h)) - 450;
  }
  return (v > 2 && v < 60) ? v : null;
}
/* % grasa (medido o estimado), masa magra y masa grasa en kg */
function composicion(b){
  const g = (b && b.grasa) || grasaNavy(b);
  if(!g || !b.peso) return null;
  return {grasa: g, magra: b.peso*(1 - g/100), grasaKg: b.peso*g/100, estimada: !b.grasa};
}

/* ================= DISCOS POR LADO (máquinas cargadas con discos) ================= */
const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25];
function discosPorLado(total){
  if(!(total > 0)) return null;
  let lado = total/2;
  const discos = [];
  DISCOS.forEach(d => { while(lado >= d - 1e-9){ discos.push(d); lado -= d; } });
  return {discos, resto: Math.round(lado*100)/100};
}

/* ================= ZONAS DE PULSO (FC máx. de Tanaka: 208 − 0,7 × edad) ================= */
function zonasFC(){
  const e = num(DB.nutri.edad);
  if(!(e > 12 && e < 95)) return null;
  const max = 208 - 0.7*e;
  return {max: Math.round(max), z2: [Math.round(max*0.6), Math.round(max*0.7)], hiit: Math.round(max*0.85)};
}

/* ================= REVISIÓN SEMANAL ================= */
function resumenSemana(f, sinSemaforo){
  const lun = lunesDe(parseIso(f)), hoy = hoyISO();
  const dias = Array.from({length:7}, (_, i) => iso(addDays(lun, i)));
  const prevDias = dias.map(k => iso(addDays(parseIso(k), -7)));
  const st = statsSemana(f);
  const vol = dias.reduce((a, k) => a + volumenDia(k), 0);
  const hasta = dias.includes(hoy) ? dias.indexOf(hoy) + 1 : 7;   // semana en curso: comparar con los mismos días de la anterior
  const volPrev = prevDias.slice(0, hasta).reduce((a, k) => a + volumenDia(k), 0);
  let habOk = 0, habTot = 0, duras = 0, perdidas = 0;
  dias.forEach(k => {
    const d = DB.days[k] || {};
    if(k <= hoy){
      HABITOS.forEach(x => { habTot++; if(d.hab && d.hab[x.id]) habOk++; });
      const p = progresoDia(k);
      if(k < hoy && !p.descanso && !p.hecho) perdidas++;
    }
    if(d.esfuerzo === 'duro') duras++;
  });
  const media = a => a.length ? a.reduce((x, y) => x + y, 0)/a.length : null;
  const pm = media(DB.body.filter(b => b.peso && dias.includes(b.f)).map(b => b.peso));
  const pp = media(DB.body.filter(b => b.peso && prevDias.includes(b.f)).map(b => b.peso));
  const recs = [];
  const sm = semaforo();
  if(!sinSemaforo && sm.color !== 'gris') recs.push(`${sm.titulo}: ${sm.txt}`);
  if(pm === null) recs.push('Registra tu peso 3 veces esta semana, en ayunas y después del baño.');
  if(perdidas >= 2) recs.push(`Esta semana van ${perdidas} sesiones sin hacer. Si te falta tiempo, prioriza los días de fuerza: son los que protegen el músculo.`);
  if(duras >= 3) recs.push('Marcaste 3 o más sesiones como "muy duras". Si además tu fuerza baja, adelanta la semana de descarga.');
  if(habTot >= 8 && habOk/habTot < 0.5) recs.push('Tus hábitos están por debajo del 50 %. Elige uno (proteína o sueño) y cúmplelo todos los días la próxima semana.');
  if(esDescarga(iso(addDays(lun, 7)))) recs.push('La próxima semana es de descarga: la mitad de las series con la misma carga.');
  return {plan: st.plan, hechas: st.hechas, vol, volPrev, habPct: habTot ? Math.round(habOk/habTot*100) : 0, duras, perdidas, pm, pp, recs: recs.slice(0, 4)};
}
