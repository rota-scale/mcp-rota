// Artes da faixa ROTA, nos tokens do Motion Kit da landing (dev_ROTA, landing/tokens.css):
// fundo #0B0C0E, painel #0F1012, lima #D1FE17, tinta #0D1400, prensa #829B19, texto #F4F5F7, rótulo #818A94,
// metal com listras de 4 px, corte em degrau de pixel e a luz no laço de 9 s com a curva (0.16, 1, 0.3, 1).
// Uma Svg com CSS começa a animar quando aparece e não recomeça num redesenho com a mesma fonte: a fonte fica fixa.

export const T = {
  fundo: '#0B0C0E',
  painel: '#0F1012',
  borda: '#24261F',
  bordaViva: '#3F4A12',
  lima: '#D1FE17',
  tinta: '#0D1400',
  prensa: '#829B19',
  texto: '#F4F5F7',
  sec: '#A5A8AE',
  rotulo: '#818A94',
  ambar: '#E0A33A',
  vermelho: '#E5534B',
} as const

const EASE = 'cubic-bezier(.16,1,.3,1)'
export const ARTE_W = 1600
export const ARTE_H = 120

/** O fundo da faixa: brilho lima à direita, listras de metal, degrau de pixel no canto e a luz passando em laço. */
export const ARTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${ARTE_W}" height="${ARTE_H}" viewBox="0 0 ${ARTE_W} ${ARTE_H}" preserveAspectRatio="none"><style>.luz{animation:luz 9s ${EASE} infinite}@keyframes luz{0%{transform:translateX(-700px);opacity:0}6%{opacity:1}40%{transform:translateX(${ARTE_W + 200}px);opacity:1}41%,100%{transform:translateX(${ARTE_W + 200}px);opacity:0}}.res{animation:res 4.5s ease-in-out infinite alternate}@keyframes res{from{opacity:.45}to{opacity:1}}.px{animation:px 6s linear infinite}@keyframes px{from{transform:translateX(0)}to{transform:translateX(-10px)}}</style><defs><radialGradient id="b" cx="1" cy=".5" r=".55"><stop offset="0" stop-color="${T.lima}" stop-opacity=".22"/><stop offset=".55" stop-color="${T.lima}" stop-opacity=".05"/><stop offset="1" stop-color="${T.lima}" stop-opacity="0"/></radialGradient><linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="${T.lima}" stop-opacity="0"/><stop offset=".5" stop-color="${T.lima}" stop-opacity=".30"/><stop offset=".62" stop-color="#ffffff" stop-opacity=".16"/><stop offset="1" stop-color="${T.lima}" stop-opacity="0"/></linearGradient><pattern id="m" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="2" height="4" fill="#ffffff" fill-opacity=".03"/></pattern><pattern id="px" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${T.lima}" fill-opacity=".10"/></pattern><linearGradient id="fx" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="mk"><rect width="${ARTE_W}" height="${ARTE_H}" fill="url(#fx)"/></mask></defs><rect width="${ARTE_W}" height="${ARTE_H}" fill="url(#m)"/><g mask="url(#mk)"><rect class="px" width="${ARTE_W + 20}" height="${ARTE_H}" fill="url(#px)"/></g><rect class="res" width="${ARTE_W}" height="${ARTE_H}" fill="url(#b)"/><path d="M${ARTE_W - 24} 0h24v24h-8v-8h-8v-8h-8z" fill="${T.lima}" fill-opacity=".5"/><rect class="luz" width="520" height="${ARTE_H}" fill="url(#l)"/></svg>`

/** A borda pulsando em lima enquanto o juiz decide. */
export const BORDA_DECIDINDO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${ARTE_W}" height="${ARTE_H}" viewBox="0 0 ${ARTE_W} ${ARTE_H}" preserveAspectRatio="none"><style>.p{animation:p 1.2s ${EASE} infinite alternate}@keyframes p{from{opacity:.25}to{opacity:1}}</style><g class="p"><rect x=".75" y=".75" width="${ARTE_W - 1.5}" height="${ARTE_H - 1.5}" rx="8" fill="none" stroke="${T.lima}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g></svg>`

/** Três pixels lima em sequência: "decidindo". */
export const PONTOS_W = 22
export const PONTOS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${PONTOS_W}" height="8" viewBox="0 0 22 8"><style>rect{animation:d 1s steps(1) infinite;opacity:.2}rect:nth-child(2){animation-delay:.33s}rect:nth-child(3){animation-delay:.66s}@keyframes d{0%{opacity:1}34%,100%{opacity:.2}}</style><rect x="1" y="2" width="4" height="4" fill="${T.lima}"/><rect x="9" y="2" width="4" height="4" fill="${T.lima}"/><rect x="17" y="2" width="4" height="4" fill="${T.lima}"/></svg>`

/** O anel do contexto usado. */
export function anelSvg(pct: number, cor: string): string {
  const p = Math.max(0, Math.min(100, pct))
  const c = 2 * Math.PI * 6
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="${cor}" stroke-opacity=".25" stroke-width="2.2"/><circle cx="8" cy="8" r="6" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linecap="butt" stroke-dasharray="${((c * p) / 100).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 8 8)"/></svg>`
}

/** A chave Auto: botão laminado lima com tinta quando ligada, apagada quando desligada. */
export function chaveSvg(ligada: boolean): string {
  return ligada
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="15" viewBox="0 0 26 15"><rect x=".5" y=".5" width="25" height="14" rx="7" fill="${T.lima}" stroke="${T.prensa}"/><circle cx="18.5" cy="7.5" r="5" fill="${T.tinta}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="15" viewBox="0 0 26 15"><rect x=".5" y=".5" width="25" height="14" rx="7" fill="#1A1C1F" stroke="#2C2F33"/><circle cx="7.5" cy="7.5" r="5" fill="${T.rotulo}"/></svg>`
}

// ---------- fundos por estado: mosaico de Game Boy ----------
// Grade fixa de células de 4 unidades, paleta de 4 tons por estado e tudo andando em degraus (steps), como num jogo de
// 8 bits: uma onda diagonal de tons no mosaico, o chão rolando e um bonequinho de pixel correndo por cima.
// Mesma técnica do effortless: um SVG constante (viewBox 360x30, recortado à direita) com o movimento em CSS.
// Do tamanho da faixa (~46 px de altura): maior que isso o app recorta e só o topo do desenho aparece.
export const FUNDO_W = 420
export const FUNDO_H = 46
export type Estado = 'economico' | 'atencao' | 'gastando' | 'decidindo'

const sorte = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
type Paleta = readonly [string, string, string, string] // do mais escuro ao mais claro
// O bonequinho, 5x6 células de 2 unidades: cabeça, olhos vazados e dois quadros de perna.
const CORPO = ['.111.', '11111', '1.1.1', '11111']
const PERNA_A = ['.1.1.', '.1.1.']
const PERNA_B = ['1...1', '1...1']
// Os desenhos saem em poucos <path> (um por classe de atraso, um por quadro do boneco) em vez de centenas de <rect>: o SVG fica
// com menos de 9 mil caracteres. O app aceita bem o símbolo R (16 mil) mas o fundo anterior, com 20 mil, não aparecia.
function caminhoDe(linhas: string[], x0: number, y0: number): string {
  let d = ''
  linhas.forEach((l, r) => [...l].forEach((c, k) => { if (c === '1') d += `M${x0 + k * 2} ${y0 + r * 2}h2v2h-2z` }))
  return d
}
function bonequinho(claro: string): string {
  const quadro = (pernas: string[], cls: string) => {
    const f = [...CORPO, ...pernas]
    return `<g class="${cls}"><path d="${caminhoDe(f, 1, 15)}" fill="#0B0C0E"/><path d="${caminhoDe(f, 0, 14)}" fill="${claro}"/></g>`
  }
  return `${quadro(PERNA_A, 'pa')}${quadro(PERNA_B, 'pb')}`
}
function mosaico(): string {
  const porClasse: string[] = Array.from({ length: 12 }, () => '')
  for (let c = 0; c < 60; c++) for (let r = 0; r < 6; r++) {
    if (sorte(c * 7 + r * 13 + 3) > 0.72) continue
    porClasse[(c + r * 2) % 12] += `M${120 + c * 4} ${r * 4}h3v3h-3z`
  }
  return porClasse.map((d, k) => `<path class="c d${k}" d="${d}"/>`).join('')
}
type Ritmo = { dur: number; corre: number; passoChao: number; quadros: number }
const PALETAS: Record<Estado, { t: Paleta; r: Ritmo }> = {
  // Econômico: lima de 4 tons, tudo calmo.
  economico: { t: ['#1B2506', '#3E5209', '#86AA12', '#D1FE17'], r: { dur: 2.4, corre: 7, passoChao: 0.8, quadros: 4 } },
  // Atenção: âmbar, o jogo acelera.
  atencao: { t: ['#2A1C06', '#5E4210', '#B8821F', '#F2C26B'], r: { dur: 1.5, corre: 4, passoChao: 0.5, quadros: 4 } },
  // Gastando à toa: vermelho, em disparada.
  gastando: { t: ['#2B0D09', '#6E1F14', '#C2361F', '#FF8A4D'], r: { dur: 0.8, corre: 1.8, passoChao: 0.25, quadros: 4 } },
  // Decidindo: lima rápido, a onda varre de ponta a ponta.
  decidindo: { t: ['#1B2506', '#3E5209', '#86AA12', '#D1FE17'], r: { dur: 0.9, corre: 2.6, passoChao: 0.3, quadros: 4 } },
}
// A parte que não muda entre redesenhos (mosaico, chão, boneco) é montada uma vez por estado.
const CORPOS_PRONTOS: Partial<Record<Estado, string>> = {}
function corpoDe(e: Estado): string {
  const c = CORPOS_PRONTOS[e]
  if (c) return c
  const { t } = PALETAS[e]
  return (CORPOS_PRONTOS[e] = `<defs><linearGradient id="f" x1="0" x2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".58" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="m"><rect width="360" height="30" fill="url(#f)"/></mask><pattern id="tj" width="8" height="4" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="${t[1]}"/><rect width="4" height="2" fill="${t[2]}"/><rect x="4" y="2" width="4" height="2" fill="${t[2]}"/></pattern></defs><g mask="url(#m)"><g class="br">${mosaico()}</g><rect x="120" y="26" width="240" height="4" fill="${t[0]}"/><g class="ch"><rect x="120" y="26" width="256" height="4" fill="url(#tj)"/></g><g class="bn">${bonequinho('#F4F5F7')}</g></g><path d="M348 0h12v12h-4v-4h-4v-4h-4z" fill="${t[3]}" fill-opacity=".8"/>`)
}
const RESERVA_FASE = 840 // segundos: o relógio dá a volta aqui, longe o bastante para nenhum laço notar

/**
 * O fundo do estado `e`, no ponto em que a animação estaria no instante `agoraMs`.
 * O app troca a imagem inteira a cada redesenho da faixa, e a animação de uma imagem nova recomeça do zero: sem isto, com
 * redesenhos frequentes, o mosaico ficaria preso no primeiro quadro. Cada elemento recebe um atraso negativo igual à fase
 * do relógio (o mesmo truque do `inPhase` do effortless), e a animação segue de onde estava.
 */
export function fundoEm(e: Estado, agoraMs: number): string {
  const { t, r } = PALETAS[e]
  const fase = (Math.max(0, agoraMs) / 1000) % RESERVA_FASE
  const f = (-fase).toFixed(3)
  const atraso = Array.from({ length: 12 }, (_, k) => `.d${k}{animation-delay:${(k * (r.dur / 12) - fase).toFixed(3)}s}`).join('')
  const estilo = `svg{background:transparent;display:block}.c{fill:${t[0]};animation:t ${r.dur}s steps(1) infinite}@keyframes t{0%{fill:${t[0]}}35%{fill:${t[1]}}55%{fill:${t[2]}}70%{fill:${t[3]}}80%{fill:${t[2]}}90%{fill:${t[1]}}100%{fill:${t[0]}}}${atraso}.ch{animation:ch ${r.passoChao}s steps(${r.quadros}) infinite;animation-delay:${f}s}@keyframes ch{from{transform:translateX(0)}to{transform:translateX(-8px)}}.bn{animation:bn ${r.corre}s steps(30) infinite;animation-delay:${f}s}@keyframes bn{0%{transform:translateX(130px);opacity:0}6%{opacity:1}94%{opacity:1}100%{transform:translateX(335px);opacity:0}}.pa{animation:pa .36s steps(1) infinite;animation-delay:${f}s}.pb{animation:pb .36s steps(1) infinite;animation-delay:${f}s}@keyframes pa{0%{opacity:1}50%,100%{opacity:0}}@keyframes pb{0%{opacity:0}50%,100%{opacity:1}}.br{animation:br 2.4s steps(4) infinite;animation-delay:${f}s}@keyframes br{0%,100%{opacity:.7}50%{opacity:1}}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FUNDO_W}" height="${FUNDO_H}" viewBox="0 0 360 30" preserveAspectRatio="xMaxYMid slice"><style>${estilo}</style>${corpoDe(e)}</svg>`
}

export const COR_ESTADO: Record<Estado, { fundo: string; borda: string; texto: string }> = {
  economico: { fundo: '#0B0C0E', borda: '#3F4A12', texto: '#D1FE17' },
  atencao: { fundo: '#141008', borda: '#5A4114', texto: '#E0A33A' },
  gastando: { fundo: '#1A0D0A', borda: '#6A2418', texto: '#FF6A3D' },
  decidindo: { fundo: '#0B0C0E', borda: '#D1FE17', texto: '#D1FE17' },
}

/** Controle do teste no app: um fundo mínimo, com dois quadrados piscando. */
export const FUNDO_CONTROLE = `<svg xmlns="http://www.w3.org/2000/svg" width="${FUNDO_W}" height="${FUNDO_H}" viewBox="0 0 360 30" preserveAspectRatio="xMaxYMid slice"><style>.q{animation:b 1s steps(2) infinite}@keyframes b{0%{opacity:1}50%{opacity:.2}}</style><rect width="360" height="30" fill="#D1FE17" fill-opacity=".25"/><rect class="q" x="200" y="8" width="20" height="14" fill="#D1FE17"/><rect class="q" x="260" y="8" width="20" height="14" fill="#D1FE17" style="animation-delay:.5s"/></svg>`
