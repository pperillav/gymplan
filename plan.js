/* =====================================================================
   PLAN SEMANAL · 5 días de fuerza + cardio/core + descanso activo
   Cada "slot" es un ejercicio del día:
     m: máquinas posibles (la primera es la recomendada; las demás sirven si está ocupada)
     s: series · r: [reps mín, reps máx] · rir: repeticiones en reserva · rest: descanso (s)
     principal: ejercicio clave del día (muestra calentamiento)
     opc: opcional (no cuenta para completar el día)
   Volumen semanal (directo = 1, indirecto = 0.5): ≥10 series en cada grupo grande.
   ===================================================================== */
const PLAN = [
 {id:'d1', dia:'Lunes', nombre:'Pierna A', sub:'Cuádriceps', tema:'piernas',
  foco:'Cuádriceps como prioridad: prensa y hack primero, cuando estás fresco. El curl sentado es tu ejercicio principal de isquiotibiales.',
  bloques:[
   {t:'Principales', slots:[
    {id:'d1e1', m:['m09','m01','dGoblet'], s:4, r:[8,10], rir:2, rest:150, principal:true},
    {id:'d1e2', m:['m10','m09','dGoblet'], s:3, r:[8,12], rir:2, rest:120}
   ]},
   {t:'Accesorios', slots:[
    {id:'d1e3', m:['m02'], s:3, r:[12,15], rir:1, rest:75},
    {id:'d1e4', m:['m04','m03','dRDL'], s:4, r:[10,12], rir:1, rest:90},
    {id:'d1e5', m:['m08','dCalf'], s:4, r:[12,15], rir:1, rest:60}
   ]},
   {t:'Core y cardio', slots:[
    {id:'d1e6', m:['m40','m41','pCrunch'], s:3, r:[12,15], rir:1, rest:45},
    {id:'d1e7', m:['cBici','cEliptica','cCinta'], cardio:true, min:10, txt:'Zona 2: puedes hablar en frases completas.'}
   ]}
  ]},
 {id:'d2', dia:'Martes', nombre:'Empuje', sub:'Pecho · Hombro · Tríceps', tema:'tronco',
  foco:'Chest press y shoulder press son los pesados del día. Si quieres hombros más anchos, añade la elevación lateral en polea.',
  bloques:[
   {t:'Principales', slots:[
    {id:'d2e1', m:['m20','mArtPress','dPress'], s:4, r:[8,10], rir:2, rest:150, principal:true},
    {id:'d2e2', m:['m50','dShoulder'], s:3, r:[8,10], rir:2, rest:120, principal:true}
   ]},
   {t:'Accesorios', slots:[
    {id:'d2e3', m:['m24'], s:3, r:[12,15], rir:1, rest:75},
    {id:'d2e4', m:['m51','pTri','dTri'], s:3, r:[10,12], rir:1, rest:75},
    {id:'d2o1', m:['pLat','dLateral'], s:3, r:[12,20], rir:1, rest:60, opc:true}
   ]},
   {t:'Core y cardio', slots:[
    {id:'d2e5', m:['m41','m40','pCrunch'], s:3, r:[12,15], rir:1, rest:45},
    {id:'d2e6', m:['cEliptica','cBici','cCinta'], cardio:true, hiit:true, min:12, txt:'2 min suaves y 6 × (30 s fuerte / 90 s suave).'}
   ]}
  ]},
 {id:'d3', dia:'Miércoles', nombre:'Tirón', sub:'Espalda · Bíceps', tema:'tronco',
  foco:'Jalón y remo con técnica limpia son el núcleo. El rear delt protege el hombro y mejora la postura.',
  bloques:[
   {t:'Principales', slots:[
    {id:'d3e1', m:['m22','dRow'], s:4, r:[8,10], rir:2, rest:150, principal:true},
    {id:'d3e2', m:['m23','mArtRow','dRow'], s:4, r:[8,12], rir:2, rest:120, principal:true}
   ]},
   {t:'Accesorios', slots:[
    {id:'d3e3', m:['m21','pFace'], s:3, r:[12,15], rir:1, rest:60},
    {id:'d3e4', m:['mBic','dCurl'], s:3, r:[10,12], rir:1, rest:75},
    {id:'d3e5', m:['m42'], s:3, r:[12,15], rir:2, rest:75}
   ]},
   {t:'Cardio', slots:[
    {id:'d3e6', m:['cCinta','cEliptica','cBici'], cardio:true, min:10, txt:'Caminata inclinada 8–12 % a 5–6 km/h, sin agarrarte.'}
   ]}
  ]},
 {id:'d4', dia:'Jueves', nombre:'Pierna B', sub:'Glúteo · Femoral', tema:'piernas',
  foco:'Cadena posterior. El Hip and Glute es el pesado del día; abducción y aducción con control, sin impulso.',
  bloques:[
   {t:'Principales', slots:[
    {id:'d4e1', m:['m07','mBooty','dHipThrust'], s:4, r:[8,10], rir:2, rest:150, principal:true},
    {id:'d4e2', m:['m01','m09','dLunge'], s:3, r:[10,12], rir:2, rest:120, nota:'Pies altos en la plataforma: más glúteo e isquiotibial.'}
   ]},
   {t:'Accesorios', slots:[
    {id:'d4e3', m:['m03','m04','dRDL'], s:4, r:[10,12], rir:1, rest:90},
    {id:'d4e4', m:['m05'], s:3, r:[12,15], rir:1, rest:60},
    {id:'d4e5', m:['m06'], s:3, r:[12,15], rir:1, rest:60},
    {id:'d4e6', m:['m08','dCalf'], s:4, r:[12,15], rir:1, rest:60}
   ]},
   {t:'Cardio', slots:[
    {id:'d4e7', m:['cBici','cEliptica','cCinta'], cardio:true, min:10, txt:'Enfriamiento suave.'}
   ]}
  ]},
 {id:'d5', dia:'Viernes', nombre:'Torso completo', sub:'Frecuencia 2', tema:'tronco',
  foco:'Segunda sesión semanal de pecho, espalda y hombro. Hoy el remo va en la articulada para variar el estímulo; descansos de 60–120 s.',
  bloques:[
   {t:'Principales', slots:[
    {id:'d5e2', m:['mArtRow','m23','dRow'], s:3, r:[10,12], rir:2, rest:120, principal:true},
    {id:'d5e1', m:['m20','mArtPress','dPress'], s:3, r:[10,12], rir:2, rest:120, principal:true}
   ]},
   {t:'Accesorios', slots:[
    {id:'d5e4', m:['m22','dRow'], s:3, r:[10,12], rir:2, rest:90},
    {id:'d5e3', m:['m50','dShoulder'], s:3, r:[10,12], rir:2, rest:90},
    {id:'d5e6', m:['mBic','dCurl'], s:3, r:[12,15], rir:1, rest:60},
    {id:'d5e5', m:['m51','pTri','dTri'], s:3, r:[12,15], rir:1, rest:60}
   ]},
   {t:'Core', slots:[
    {id:'d5e7', m:['m40','m41','pCrunch'], s:3, r:[12,15], rir:1, rest:45}
   ]}
  ]},
 {id:'d6', dia:'Sábado', nombre:'Cardio + Core', sub:'Gasto calórico', tema:'cardio',
  foco:'Elige la modalidad de cardio según tu energía. Si te sobra, haz los opcionales.',
  bloques:[
   {t:'Cardio', slots:[
    {id:'d6e1', m:['cCinta','cEliptica','cBici'], cardio:true, min:35,
     protocolos:[{v:'z2', t:'Zona 2 · 35 min', min:35},{v:'hiit', t:'Intervalos · 20 min (8 × 30 s fuerte / 90 s suave)', min:20}]}
   ]},
   {t:'Core y complementos', slots:[
    {id:'d6e4', m:['m41','m40','pCrunch'], s:3, r:[15,20], rir:1, rest:45},
    {id:'d6e5', m:['m42'], s:2, r:[12,15], rir:2, rest:60},
    {id:'d6e6', m:['m08','dCalf'], s:3, r:[12,15], rir:1, rest:60},
    {id:'d6o1', m:['pLat','dLateral'], s:3, r:[12,20], rir:1, rest:60, opc:true},
    {id:'d6o2', m:['m04','m03'], s:2, r:[12,15], rir:1, rest:60, opc:true}
   ]}
  ]},
 {id:'d7', dia:'Domingo', nombre:'Descanso activo', sub:'Recuperación', tema:'descanso', descanso:true,
  foco:'El músculo se reconstruye cuando descansas. Una caminata suave suma gasto sin fatiga.',
  bloques:[
   {t:'Opcional', slots:[
    {id:'d7e1', m:['cCaminata','cCinta'], cardio:true, min:40, opc:true, txt:'30–45 min muy suaves.'}
   ]}
  ]}
];

/* Índices rápidos */
const SLOT = {};      // slotId -> {slot, dia}
PLAN.forEach(d => d.bloques.forEach(b => b.slots.forEach(s => { SLOT[s.id] = {slot:s, dia:d}; })));
const RUTINA = {};    // id de día -> día
PLAN.forEach(d => { RUTINA[d.id] = d; });

/* Mapa de ejercicios de versiones anteriores -> máquina (para migrar el historial) */
const LEGACY = {
  d1e1:'m09', d1e2:'m10', d1e3:'m02', d1e4:'m04', d1e5:'m08', d1e6:'m40', d1e7:'cBici',
  d2e1:'m20', d2e2:'m50', d2e3:'m24', d2e4:'m51', d2e5:'m41', d2e6:'cEliptica',
  d3e1:'m22', d3e2:'m23', d3e3:'m21', d3e4:'mBic', d3e5:'m42', d3e6:'cCinta',
  d4e1:'m07', d4e2:'m01', d4e3:'m03', d4e4:'m05', d4e5:'m06', d4e6:'m08', d4e7:'cBici',
  d5e1:'m20', d5e2:'m23', d5e3:'m50', d5e4:'m22', d5e5:'m51', d5e6:'mBic', d5e7:'m40', d5e8:'m42',
  d6e1:'cCinta', d6e2:'cBici', d6e3:'m40', d6e4:'m41', d6e5:'m42', d6o1:'mBic', d6o2:'m51', d7e1:'cCaminata'
};

/* Grupos para el volumen semanal (objetivo 10–20 en los grandes) */
const GRUPOS = [
  {g:'Pecho', meta:true}, {g:'Espalda', meta:true}, {g:'Hombro', meta:true},
  {g:'Cuádriceps', meta:true}, {g:'Isquiotibiales', meta:true}, {g:'Glúteos', meta:true},
  {g:'Gemelos', meta:true}, {g:'Bíceps', meta:true}, {g:'Tríceps', meta:true},
  {g:'Aductores', meta:false}, {g:'Core', meta:false}, {g:'Lumbar', meta:false}
];

/* ---------------- TIPS para tu objetivo ---------------- */
const TIPS = [
 {c:'Entrenamiento', t:'Entrenar pesado es la señal que conserva el músculo en déficit. No bajes la carga para "quemar más": eso lo hace la dieta.'},
 {c:'Entrenamiento', t:'RIR 2 significa terminar la serie sabiendo que podrías hacer 2 repeticiones más con buena técnica.'},
 {c:'Entrenamiento', t:'Sube la carga solo cuando completes el tope del rango en todas las series. La app te lo sugiere en cada ejercicio.'},
 {c:'Entrenamiento', t:'Anota los ajustes de cada máquina la primera vez (asiento, respaldo). Repetir la posición hace comparable tu progreso.'},
 {c:'Entrenamiento', t:'¿Máquina ocupada? Cámbiala en el selector del ejercicio: la app guarda el progreso por máquina, no se mezcla.'},
 {c:'Entrenamiento', t:'Descansa 2–3 min en los principales. Acortar descansos no quema más grasa y sí baja el rendimiento.'},
 {c:'Entrenamiento', t:'Cada 6 semanas hay descarga: la mitad de las series con la misma carga. Llegas más fuerte al bloque siguiente.'},
 {c:'Entrenamiento', t:'Haz el cardio después de las pesas. El de intervalos, lejos de los días de pierna pesada.'},
 {c:'Nutrición', t:'Reparte la proteína en 3–5 comidas, unos 0.4 g por kg en cada una.'},
 {c:'Nutrición', t:'Medio plato de verduras: más volumen y saciedad con pocas calorías.'},
 {c:'Nutrición', t:'Ten 2–3 comidas altas en proteína que te gusten y repítelas. La simplicidad sostiene el déficit.'},
 {c:'Nutrición', t:'Las bebidas azucaradas y el alcohol suman calorías sin saciar: son el ajuste más fácil de hacer.'},
 {c:'Nutrición', t:'Come algo con proteína y carbohidrato 1–3 h antes de entrenar para rendir mejor.'},
 {c:'Nutrición', t:'Si tienes hambre constante y la fuerza cae, el déficit es demasiado grande: sube 150–200 kcal.'},
 {c:'Recuperación', t:'Duerme 7–9 h. Dormir poco aumenta el hambre y reduce el rendimiento del día siguiente.'},
 {c:'Recuperación', t:'Camina 8 000–10 000 pasos al día: suma gasto calórico sin fatigar tus piernas para el gimnasio.'},
 {c:'Recuperación', t:'Si tu fuerza cae dos sesiones seguidas, revisa sueño, comida y estrés antes de añadir más trabajo.'},
 {c:'Progreso', t:'Pésate 3–4 veces por semana en ayunas y mira la tendencia, no el dato del día: el agua mueve la báscula 1–2 kg.'},
 {c:'Progreso', t:'Mide la cintura cada semana. En recomposición puede bajar aunque el peso casi no se mueva.'},
 {c:'Progreso', t:'Toma fotos cada 4 semanas con la misma luz, hora y pose.'},
 {c:'Progreso', t:'Si tu fuerza se mantiene o sube mientras el peso baja, estás perdiendo grasa y no músculo.'},
 {c:'Progreso', t:'La meta es la consistencia de las semanas, no la perfección de un día.'}
];

const HABITOS = [
  {id:'prot',  t:'Proteína'},
  {id:'sueno', t:'Sueño 7 h+'},
  {id:'pasos', t:'8 000 pasos'},
  {id:'agua',  t:'Agua'}
];

const PROTE_EJEMPLOS = [
  '150 g de pechuga de pollo cocida ≈ 45 g',
  '150 g de carne de res magra cocida ≈ 40 g',
  'Lata de atún en agua (≈120 g escurrido) ≈ 30 g',
  '3 huevos + 3 claras ≈ 30 g',
  '1 scoop de proteína whey ≈ 20–25 g',
  '200 g de yogur griego natural ≈ 15–20 g',
  '1 taza de lentejas cocidas ≈ 18 g',
  '100 g de queso campesino ≈ 15–18 g'
];

const FRASES = [
 {f:'La disciplina pesa gramos; el arrepentimiento pesa toneladas.', a:'Jim Rohn (adaptada)'},
 {f:'No tienes que ser extremo, solo consistente.', a:''},
 {f:'El mejor entrenamiento es el que sí hiciste.', a:''},
 {f:'La grasa se pierde en la cocina; el músculo se defiende en el gimnasio.', a:''},
 {f:'No cuentes los días. Haz que los días cuenten.', a:'Muhammad Ali'},
 {f:'Un 1 % mejor cada día es 37 veces mejor en un año.', a:'James Clear'},
 {f:'La recomposición se mide en semanas, no en días.', a:''},
 {f:'Tu único rival es el que fuiste ayer.', a:''}
];
