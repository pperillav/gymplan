/* Pictogramas SVG: figura gris, máquina y flecha de movimiento en el color de zona. "ACC" = color. */
const FIG = '#E8E8EC';
function svgo(inner){ return '<svg viewBox="0 0 96 96" fill="none" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>'; }
function fle(x1,y1,x2,y2){
  const a=Math.atan2(y2-y1,x2-x1), L=9, w=Math.PI/7;
  const p1x=x2-L*Math.cos(a-w), p1y=y2-L*Math.sin(a-w), p2x=x2-L*Math.cos(a+w), p2y=y2-L*Math.sin(a+w);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="ACC" stroke-width="5"/><polygon points="${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}" fill="ACC" stroke="none"/>`;
}
function fleC(x1,y1,cx,cy,x2,y2){
  const a=Math.atan2(y2-cy,x2-cx), L=9, w=Math.PI/7;
  const p1x=x2-L*Math.cos(a-w), p1y=y2-L*Math.sin(a-w), p2x=x2-L*Math.cos(a+w), p2y=y2-L*Math.sin(a+w);
  return `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="ACC" stroke-width="5"/><polygon points="${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}" fill="ACC" stroke="none"/>`;
}
const cab = (x,y)=>`<circle cx="${x}" cy="${y}" r="6.5" fill="${FIG}" stroke="none"/>`;
const lin = (pts,c=FIG,w=5.5)=>`<polyline points="${pts}" stroke="${c}" stroke-width="${w}"/>`;
const asiento = `<polyline points="14,76 40,76 40,76" stroke="ACC" stroke-width="7"/><line x1="18" y1="76" x2="18" y2="44" stroke="ACC" stroke-width="7"/>`;

const PICT = {
  prensa45: svgo(`<line x1="60" y1="22" x2="86" y2="48" stroke="ACC" stroke-width="9"/><line x1="12" y1="66" x2="38" y2="84" stroke="ACC" stroke-width="7"/>`+cab(22,52)+lin('27,58 40,70')+lin('40,70 55,58')+lin('55,58 66,42')+fle(50,78,70,58)),
  prensaH: svgo(`<line x1="76" y1="36" x2="76" y2="70" stroke="ACC" stroke-width="9"/><polyline points="12,78 34,78" stroke="ACC" stroke-width="7"/><line x1="14" y1="78" x2="14" y2="48" stroke="ACC" stroke-width="7"/>`+cab(26,38)+lin('26,45 28,64')+lin('28,64 48,60')+lin('48,60 72,56')+fle(58,78,80,78)),
  hack: svgo(`<line x1="30" y1="18" x2="64" y2="78" stroke="ACC" stroke-width="10"/>`+cab(32,30)+lin('36,36 50,58')+lin('50,58 40,70')+lin('40,70 52,82')+fle(76,50,62,26)),
  extension: svgo(asiento+cab(28,36)+lin('28,43 28,62')+lin('28,62 46,62')+lin('46,62 62,52')+fleC(52,76,66,72,66,50)),
  curlSentado: svgo(asiento+cab(28,36)+lin('28,43 28,62')+lin('28,62 48,60')+lin('48,60 58,74')+fleC(66,48,70,64,58,78)),
  curlAcostado: svgo(`<line x1="12" y1="72" x2="70" y2="72" stroke="ACC" stroke-width="8"/>`+cab(18,62)+lin('25,66 52,66')+lin('52,66 62,50')+fleC(74,64,76,46,64,38)),
  calf: svgo(`<line x1="30" y1="84" x2="62" y2="84" stroke="ACC" stroke-width="7"/>`+cab(44,20)+lin('44,27 44,54')+lin('44,54 46,72')+lin('46,72 54,76')+fle(64,66,64,44)),
  hipthrust: svgo(`<line x1="10" y1="60" x2="28" y2="60" stroke="ACC" stroke-width="9"/>`+cab(15,46)+lin('21,54 44,50')+lin('44,50 56,62')+lin('56,62 56,80')+`<circle cx="44" cy="44" r="6" stroke="ACC" stroke-width="5"/>`+fle(44,32,44,14)),
  abduccion: svgo(cab(48,22)+lin('48,29 48,50')+lin('48,50 36,68')+lin('48,50 60,68')+fle(34,58,18,50)+fle(62,58,78,50)),
  aduccion: svgo(cab(48,22)+lin('48,29 48,50')+lin('48,50 32,68')+lin('48,50 64,68')+fle(20,50,36,58)+fle(76,50,60,58)),
  chest: svgo(asiento+cab(28,32)+lin('28,39 28,60')+lin('28,60 44,60')+lin('44,60 44,76')+lin('28,44 42,44')+lin('42,44 54,44')+fle(58,44,80,44)),
  jalon: svgo(`<line x1="26" y1="14" x2="64" y2="14" stroke="ACC" stroke-width="7"/>`+asiento+cab(34,38)+lin('34,45 34,64')+lin('34,64 50,64')+lin('34,48 30,32')+lin('30,32 30,18')+lin('34,48 48,32')+lin('48,32 48,18')+fle(72,20,72,42)),
  remo: svgo(asiento+cab(30,32)+lin('30,39 30,60')+lin('30,60 46,60')+lin('46,60 46,76')+lin('30,44 46,48')+lin('46,48 60,48')+fle(80,48,60,48)),
  reardelt: svgo(cab(48,22)+lin('48,29 48,54')+lin('48,36 32,32')+lin('48,36 64,32')+fle(30,40,16,48)+fle(66,40,80,48)),
  fly: svgo(cab(48,22)+lin('48,29 48,54')+lin('48,38 28,30')+lin('48,38 68,30')+fleC(24,22,34,10,44,12)+fleC(72,22,62,10,52,12)),
  shoulder: svgo(asiento+cab(30,34)+lin('30,41 30,62')+lin('30,62 46,62')+lin('30,44 42,40')+lin('42,40 42,26')+fle(54,28,54,10)),
  triceps: svgo(asiento+cab(30,30)+lin('30,37 30,58')+lin('30,58 46,58')+lin('46,58 46,74')+lin('30,42 42,48')+lin('42,48 44,62')+fle(56,48,56,70)),
  biceps: svgo(`<line x1="40" y1="52" x2="62" y2="52" stroke="ACC" stroke-width="8"/>`+cab(28,26)+lin('28,33 28,56')+lin('28,40 40,52')+lin('40,52 54,44')+fleC(62,40,60,26,46,24)),
  crunch: svgo(asiento+cab(44,32)+`<path d="M28,62 Q28,44 40,38" stroke="${FIG}" stroke-width="5.5"/>`+lin('28,62 46,62')+lin('46,62 46,76')+fleC(58,26,64,38,58,50)),
  mts: svgo(asiento+`<line x1="52" y1="30" x2="52" y2="46" stroke="ACC" stroke-width="6"/>`+cab(42,30)+`<path d="M28,62 Q28,44 38,37" stroke="${FIG}" stroke-width="5.5"/>`+lin('28,62 46,62')+lin('46,62 46,76')+fleC(62,24,68,36,62,48)),
  lumbar: svgo(`<line x1="30" y1="62" x2="52" y2="66" stroke="ACC" stroke-width="9"/>`+cab(70,32)+lin('66,38 46,58')+lin('46,58 30,64')+lin('30,64 24,80')+fleC(80,58,84,44,76,34)),
  bici: svgo(`<circle cx="30" cy="70" r="11" stroke="ACC" stroke-width="5"/><circle cx="68" cy="70" r="11" stroke="ACC" stroke-width="5"/><polyline points="30,70 44,52 62,52 68,70" stroke="ACC" stroke-width="5"/>`+cab(48,24)+lin('48,30 44,48')+lin('44,48 56,44')+lin('44,48 42,62')),
  eliptica: svgo(`<line x1="20" y1="82" x2="76" y2="82" stroke="ACC" stroke-width="7"/><line x1="62" y1="30" x2="58" y2="74" stroke="ACC" stroke-width="5"/>`+cab(42,22)+lin('42,29 44,50')+lin('44,50 34,68')+lin('44,50 56,64')+lin('42,36 58,36')),
  trote: svgo(`<line x1="16" y1="84" x2="80" y2="82" stroke="ACC" stroke-width="8"/>`+cab(46,20)+lin('46,27 42,46')+lin('42,46 56,58')+lin('56,58 54,74')+lin('42,46 32,62')+lin('44,32 56,28')+lin('44,34 32,42')),
  caminata: svgo(cab(44,22)+lin('44,29 44,50')+lin('44,50 34,72')+lin('44,50 56,68')+lin('56,68 58,80')+lin('44,34 54,42')+lin('44,34 34,44')+fle(66,50,84,50)),
  lateral: svgo(cab(44,20)+lin('44,27 44,58')+lin('44,58 38,82')+lin('44,58 52,82')+lin('44,34 68,40')+`<line x1="68" y1="40" x2="86" y2="86" stroke="ACC" stroke-width="3"/>`+fleC(76,56,82,44,76,30)),
  step: svgo(`<rect x="50" y="62" width="34" height="20" rx="3" stroke="ACC" stroke-width="5"/>`+cab(40,18)+lin('40,25 42,48')+lin('42,48 58,52')+lin('58,52 60,62')+lin('42,48 34,66')+lin('34,66 32,82')+fle(22,62,22,38))
};

/* Devuelve el SVG de una máquina con la flecha/estructura en el color de su zona */
function pict(clave, color){ return (PICT[clave] || PICT.caminata).replaceAll('ACC', color || '#FFD500'); }
