// ROTA esforço: escolhe o esforço de raciocínio de cada mensagem.
// Ordem: nível pedido na mensagem > continuação curta mantém > tabela de roteamento do MCP ROTA > Haiku.
// Piso médio; categoria criativa de régua alta não desce de high. O modelo não troca sozinho (reescreveria o cache).
// Método adaptado do effortless (HeyCubit, MIT); ver NOTICE.md.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Escolha, Esforco, Gasto, Limite } from '../types'
import { anelSvg, chaveSvg, COR_ESTADO, FUNDO_CONTROLE, fundoEm, FUNDO_H, FUNDO_W, PONTOS_SVG, PONTOS_W, T } from './arte'
import type { Estado } from './arte'
import { MARCA_OFF_SVG, MARCA_SVG } from './marca'

const ESFORCOS: Esforco[] = ['low', 'medium', 'high', 'xhigh', 'max']
const ROTULO: Record<Esforco, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto', xhigh: 'Muito alto', max: 'Máximo' }
const LIMA = '#D1FE17'
const TABELA_URL = 'https://mcp.rotasaas.com/roteamento.json'
const TABELA_VALE_MS = 60 * 60_000
const HAIKU = 'claude-haiku-5-5'

const escolha = atom({ plugin: 'rota-esforco', key: 'escolha' } as const, null)
const decidindo = atom({ plugin: 'rota-esforco', key: 'decidindo' } as const, false)
const auto = atom({ plugin: 'rota-esforco', key: 'auto' } as const, true)
const contexto = atom({ plugin: 'rota-esforco', key: 'contexto' } as const, null)
const modelo = atom({ plugin: 'rota-esforco', key: 'modelo' } as const, null)
const gasto = atom({ plugin: 'rota-esforco', key: 'gasto' } as const, null)
const limite = atom({ plugin: 'rota-esforco', key: 'limite' } as const, null)
const teste = atom({ plugin: 'rota-esforco', key: 'teste' } as const, false) // /rota-esforco teste mostra 3 faixas para diagnosticar o fundo

type Categoria = { id: string; nome: string; esforco: Esforco; criativo?: boolean; repetida?: Esforco; padroes: string[]; porque: string }
type Tabela = { piso: Esforco; teto: Esforco; categorias: Categoria[]; atualizado?: string }

// Reserva quando a tabela pública não responde e nada foi guardado: só o piso, e o Haiku decide.
const RESERVA: Tabela = { piso: 'medium', teto: 'max', categorias: [] }

let tabela: Tabela = RESERVA

const idx = (e: Esforco) => ESFORCOS.indexOf(e)
const maior = (a: Esforco, b: Esforco) => (idx(a) >= idx(b) ? a : b)
export function limitado(e: Esforco, piso: Esforco, teto: Esforco): Esforco {
  return ESFORCOS[Math.max(idx(piso), Math.min(idx(teto), idx(e)))] ?? piso
}
// Só nos modelos em que trocar o esforço não reescreve o cache (mesma regra do effortless).
export const cacheSeguro = (id: string) => /(opus|sonnet)-5-5/.test(id)
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** "ok", "sim", "pode", "segue": até duas palavras e doze caracteres. */
export function continuacao(texto: string): boolean {
  const t = texto.trim()
  return t.length > 0 && t.length <= 12 && t.split(/\s+/).length <= 2
}

/** O nível dito na mensagem ("esforço máximo", "effort high", "pensa com calma"). */
export function nivelPedido(texto: string): Esforco | undefined {
  const t = semAcento(texto)
  const m = /\b(?:esforco|effort)\s*[:=]?\s*(baixo|medio|alto|muito alto|maximo|low|medium|high|xhigh|max)\b/.exec(t)
  if (m) {
    const mapa: Record<string, Esforco> = { baixo: 'low', medio: 'medium', alto: 'high', 'muito alto': 'xhigh', maximo: 'max', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' }
    return m[1] ? mapa[m[1]] : undefined
  }
  // "deveria estar medio", "coloca em alto", "volta para medium": a pessoa diz o nível que quer.
  const quer = /\b(?:deveria|devia|queria|coloca|bota|usa|muda|volta|deixa)\s+(?:de\s+)?(?:ser|ta|estar|em|pra|para|no|na)?\s*(baixo|medio|medium|alto|high|muito alto|xhigh|maximo|max)\b/.exec(t)
  if (quer?.[1]) {
    const nivel: Record<string, Esforco> = { baixo: 'low', medio: 'medium', medium: 'medium', alto: 'high', high: 'high', 'muito alto': 'xhigh', xhigh: 'xhigh', maximo: 'max', max: 'max' }
    return nivel[quer[1]]
  }
  if (/\b(ultrathink|pensa (muito|bem|com calma)|capricha|seja minucios[oa])\b/.test(t)) return 'xhigh'
  return undefined
}

/** A categoria da tabela pelo texto, ou nada. */
export function classificar(texto: string, t: Tabela): Categoria | undefined {
  const s = semAcento(texto).slice(0, 4000)
  return t.categorias.find(c => c.padroes.some(p => {
    try {
      return new RegExp(p, 'i').test(s)
    } catch {
      return false
    }
  }))
}

const JUIZ = `Você escolhe o esforço de raciocínio de um assistente agêntico (lê arquivos, roda ferramentas, edita) para a próxima mensagem de uma pessoa da ROTA, uma produtora de vídeo, motion, som, 3D e software. Escolha o menor esforço que ainda faz o trabalho bem.

Níveis: medium (trabalho normal, perguntas, ajustes pequenos), high (trabalho difícil, várias etapas, peça criativa, mudança em produção), xhigh (muito difícil: arquitetura, auditoria, pesquisa que cruza fontes), max (só quando pedirem o máximo). Nunca low.

Julgue o tamanho do trabalho, não o tamanho da mensagem: "revisa o projeto inteiro" é grande. Se a mensagem responde a uma pergunta da última resposta do assistente ("sim", "a B", "pode"), julgue o trabalho que essa resposta dispara. Correção, reprovação ou acréscimo a um trabalho em andamento mantém pelo menos o esforço desse trabalho, MAS uma pergunta ou dúvida que não pede trabalho novo (por que, como, qual, será que) é medium, mesmo no meio de um trabalho pesado. Agradecimento sem pedido novo é medium.

Responda só JSON: {"effort":"medium|high|xhigh|max","why":"até 6 palavras, em português"}`

async function contextoRecente($: EngineInterface): Promise<string> {
  try {
    const msgs = (await $.session.messages()) as readonly { role: string; text: string }[]
    const resposta = [...msgs].reverse().find(m => m.role === 'assistant' && m.text?.trim())?.text ?? ''
    return resposta ? `Última resposta do assistente (fim):\n${resposta.slice(-1500)}` : ''
  } catch {
    return ''
  }
}

async function perguntarHaiku($: EngineInterface, texto: string, atual: Esforco | null): Promise<{ esforco: Esforco; porque: string } | undefined> {
  const pergunta = [atual ? `Esforço atual: ${atual}` : '', await contextoRecente($), `Próxima mensagem:\n${texto.slice(0, 2000)}`].filter(Boolean).join('\n\n')
  const pedir = (model: string) => $.model.complete({ model, system: JUIZ, prompt: pergunta, maxTokens: 80, effort: 'low', timeoutMs: 6000 })
  let r = await pedir(HAIKU)
  if (!r.isAnswered) r = await pedir('haiku')
  if (!r.isAnswered) return undefined
  try {
    const j = JSON.parse((r.text.match(/\{[\s\S]*\}/) ?? ['{}'])[0]) as { effort?: string; why?: string }
    if (!ESFORCOS.includes(j.effort as Esforco)) return undefined
    return { esforco: j.effort as Esforco, porque: String(j.why ?? '').slice(0, 60) }
  } catch {
    return undefined
  }
}

/** Tabela pública do MCP ROTA, guardada por uma hora; sem rede, a última guardada; sem nada, a reserva. */
async function carregarTabela($: EngineInterface) {
  const guardada = (await $.store.get('tabela').catch(() => undefined)) as { em: number; t: Tabela } | undefined
  if (guardada?.t?.categorias) tabela = guardada.t
  if (guardada && Date.now() - guardada.em < TABELA_VALE_MS) return
  try {
    const r = await $.http.fetch(TABELA_URL)
    if (!r.ok) return
    const t = JSON.parse(r.text) as Tabela
    if (!Array.isArray(t.categorias) || !ESFORCOS.includes(t.piso)) return
    tabela = t
    await $.store.set('tabela', { em: Date.now(), t })
  } catch {
    // sem rede: segue com a guardada ou a reserva
  }
}

const NOME_MODELO = (id: string) => (/haiku/.test(id) ? 'Haiku' : /sonnet/.test(id) ? 'Sonnet' : /opus/.test(id) ? 'Opus' : /fable/.test(id) ? 'Fable' : '')

async function lerUso($: EngineInterface) {
  try {
    const { context, rateLimits } = await $.session.usage()
    const janelas = (rateLimits ?? []).filter(l => l.kind === 'five_hour' || l.kind === 'seven_day').sort((a, b) => b.percentUsed - a.percentUsed)
    const topo = janelas[0]
    const novo: Limite | null = topo ? { pct: Math.round(topo.percentUsed), tipo: topo.kind === 'seven_day' ? 'semanal' : 'de 5 horas', volta: topo.resetsAt ?? null } : null
    await update($, limite, () => novo)
    // A janela vem do app e pode ser a de 200k mesmo com o modelo de 1M (o painel do app mostrou 18% de 1M enquanto a faixa
    // dizia 85%). Quando o id do modelo marca 1M, ou os tokens já passam de 200k, a janela é 1M.
    const id = await $.session.model().catch(() => '')
    const tokens = context.tokens ?? 0
    const janela = /1m|(opus|sonnet|fable)-5/i.test(String(id)) || tokens > 200_000 ? Math.max(context.window ?? 0, 1_000_000) : context.window
    const pct = janela ? (tokens / janela) * 100 : context.percent || 0
    if (Number.isFinite(pct) && pct > 0) await update($, contexto, () => Math.round(pct))
  } catch {
    // sem uso ainda
  }
  try {
    const nome = NOME_MODELO(await $.session.model()) || null
    await update($, modelo, () => nome)
  } catch {
    // sem modelo
  }
}

// Peso de cada token contra um token de entrada sem cache (as mesmas razões em todo modelo Claude; o effortless mediu
// que leitura de cache é a maior parte do custo de uma sessão).
const PESO = { entrada: 1, escrita: 1.25, leitura: 0.1, saida: 5 }
const TTL_MS = { '5m': 5 * 60_000, '1h': 60 * 60_000 } as const
type Uso = { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; cache_creation?: { ephemeral_1h_input_tokens?: number; ephemeral_5m_input_tokens?: number } }

/** Registra o que uma resposta da conversa principal gastou: cache, peso do turno e se o cache foi reescrito. */
async function anotarUso($: EngineInterface, u: Uso, novoTurno: boolean) {
  const ent = u.input_tokens ?? 0, le = u.cache_read_input_tokens ?? 0, esc = u.cache_creation_input_tokens ?? 0, sai = u.output_tokens ?? 0
  const ttl: '5m' | '1h' = (u.cache_creation?.ephemeral_5m_input_tokens ?? 0) > 0 && !(u.cache_creation?.ephemeral_1h_input_tokens ?? 0) ? '5m' : '1h'
  const agora = await $.clock.now().catch(() => Date.now())
  const total = ent + le + esc
  const peso = ent * PESO.entrada + esc * PESO.escrita + le * PESO.leitura + sai * PESO.saida
  await update($, gasto, g => {
    // Esta resposta reescreveu o cache se o anterior já tinha vencido antes dela e a maior parte do contexto foi escrita de novo.
    const venceu = g?.cacheAte != null && agora > g.cacheAte
    return {
      cacheAte: agora + TTL_MS[ttl],
      ttl,
      cachePct: total > 0 ? Math.round((le / total) * 100) : g?.cachePct ?? null,
      turnoTok: (novoTurno ? 0 : g?.turnoTok ?? 0) + total + sai,
      turnoPeso: (novoTurno ? 0 : g?.turnoPeso ?? 0) + peso,
      sessaoPeso: (g?.sessaoPeso ?? 0) + peso,
      reconstruiu: venceu && total > 0 && esc / total > 0.3,
      relMediana: g?.relMediana ?? null,
      jev: novoTurno ? null : g?.jev ?? null,
    }
  })
}

// ---------- Jev (TypeSafe): segunda opinião sobre o gasto, só com números ----------
const JEV_URL = 'https://api.typesafe.ai/v1/systemone'
const JEV_TIMEOUT_MS = 3000
const JEV_TAREFA =
  'Classify how economical one turn of an agentic assistant session was. You get only numbers: the effort used, the kind of work, ' +
  'how full the context window is, what share of the context came from the prompt cache, how heavy this turn was compared with ' +
  "the person's own median turn, and whether the cache had expired. Heavy turns are fine for hard creative or research work and " +
  'wasteful for chit-chat. A low cache share is only a problem when the cache had NOT expired. Answer economical, attention or wasteful.'

/** O que vai para a TypeSafe: só números, booleanos e o rótulo fixo da categoria da tabela. Nunca texto do usuário. */
export function estadoParaJev(g: Gasto, ctxPct: number | null, esforco: Esforco | null, categoria: string | null) {
  return {
    task: JEV_TAREFA,
    effort_used: esforco,
    kind_of_work: categoria,
    context_percent: ctxPct,
    cache_share_percent: g.cachePct,
    cache_had_expired: g.reconstruiu,
    turn_weight_vs_median: g.relMediana === null ? null : Math.round(g.relMediana * 10) / 10,
    turn_weight_units: Math.round(g.turnoPeso),
  }
}

async function chaveJev($: EngineInterface): Promise<string | undefined> {
  const k = (await $.env.get('TYPESAFE_API_KEY').catch(() => undefined)) as string | undefined
  return k && k.trim() ? k.trim() : undefined
}

async function perguntarJev($: EngineInterface, key: string, estado: ReturnType<typeof estadoParaJev>): Promise<{ nivel: 'economico' | 'atencao' | 'gastando'; conf: number } | undefined> {
  try {
    const { task, ...state } = estado
    const res = await Promise.race([
      $.http.fetch(JEV_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'jev-latest',
          state: { task, ...state },
          questions: { spend: { type: 'choice', instructions: 'How economical was this turn?', criteria: { economico: 'economical: the spend fits the work', atencao: 'attention: not wasteful yet, but heading there', gastando: 'wasteful: spend clearly above what the work needs' } } },
        }),
      }),
      $.clock.sleep(JEV_TIMEOUT_MS).then(() => {
        throw new Error('timeout')
      }),
    ])
    if (!res.ok) return undefined
    const a = (JSON.parse(res.text) as { answers?: Record<string, { choice?: string; confidence?: number; probabilities?: Record<string, number> }> }).answers?.spend
    const nivel = a?.choice
    if (nivel !== 'economico' && nivel !== 'atencao' && nivel !== 'gastando') return undefined
    const conf = a?.confidence ?? a?.probabilities?.[nivel]
    return typeof conf === 'number' ? { nivel, conf } : undefined
  } catch {
    return undefined
  }
}

/** Fecha o turno: compara o peso dele com o seu normal (mediana dos turnos guardados, entre sessões) e guarda. */
export function medianaDe(v: number[]): number {
  const o = [...v].sort((a, b) => a - b)
  return o.length ? (o.length % 2 ? o[(o.length - 1) / 2] ?? 0 : ((o[o.length / 2 - 1] ?? 0) + (o[o.length / 2] ?? 0)) / 2) : 0
}
type Hist = { p: number; c: string | null }
async function fecharTurno($: EngineInterface) {
  const g = await read($, gasto)
  if (!g || g.turnoPeso <= 0) return
  const cat = (await read($, escolha))?.categoria ?? null
  const antes = ((await $.store.get('hist').catch(() => [])) as Hist[] | undefined) ?? []
  // Estudo e auditoria são pesados de propósito: não entram na régua do que é normal.
  const normais = antes.filter(h => !h.c?.startsWith('estudo')).map(h => h.p)
  const rel = normais.length >= 8 && !cat?.startsWith('estudo') ? g.turnoPeso / Math.max(1, medianaDe(normais)) : null
  await update($, gasto, old => (old ? { ...old, relMediana: rel } : old))
  // Segunda opinião do Jev, só quando a medição não deu Econômico, só com a chave do ambiente e só se não foi desligado.
  const ligado = ((await $.store.get('jev').catch(() => undefined)) ?? true) !== false
  const key = ligado ? await chaveJev($) : undefined
  const atual = await read($, gasto)
  if (key && atual && seloMedido(atual, await read($, contexto), await $.clock.now().catch(() => Date.now()))?.cor !== 'lima') {
    const e = await read($, escolha)
    const jev = await perguntarJev($, key, estadoParaJev(atual, await read($, contexto), e?.esforco ?? null, cat))
    if (jev) await update($, gasto, old => (old ? { ...old, jev } : old))
  }
  await $.store.set('hist', [...antes, { p: Math.round(g.turnoPeso), c: cat }].slice(-60))
}

/** O selo do gasto: econômico, atenção ou gastando à toa, com o motivo que importa agora. */
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function quandoVolta(iso: string | null, agora: number): string {
  if (!iso) return ''
  const d = new Date(iso)
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return d.getTime() - agora < 20 * 3600_000 ? hm : `${DIAS[d.getDay()]} ${hm}`
}
type Selo = { selo: string; cor: 'lima' | 'ambar' | 'vermelho'; motivo: string; curto: string }
/**
 * O selo mede DESPERDÍCIO, não consumo, e só com o que foi medido:
 * - turno caro: o peso do turno passou de 2,5 vezes a mediana dos seus turnos normais (precisa de 8 turnos de histórico);
 * - cache perdido: menos da metade do contexto veio do cache sem o cache ter vencido (algo o invalidou no meio da conversa);
 * - contexto cheio: cada requisição relê o contexto inteiro.
 * Atenção é o que ainda não desperdiçou mas vai: cache vencido com contexto grande, contexto alto, turno acima do normal.
 * O limite de uso NÃO entra aqui: é orçamento, não desperdício (ver alertaLimite).
 */
function seloMedido(g: Gasto | null, contextoPct: number | null, agora: number): Selo | null {
  if (!g) return null
  const ctx = contextoPct ?? 0
  // Turno pequeno nunca gera aviso por peso, por mais acima da mediana que esteja.
  const rel = g.turnoPeso >= 20_000 ? g.relMediana : null
  const frioAgora = g.cacheAte !== null && agora > g.cacheAte
  if (rel !== null && rel >= 2.5) return { selo: 'Gastando à toa', cor: 'vermelho', motivo: `este turno pesou ${rel.toFixed(1).replace('.', ',')}x o seu normal`, curto: 'turno caro' }
  if (!g.reconstruiu && g.cachePct !== null && g.cachePct < 50 && ctx >= 20) return { selo: 'Gastando à toa', cor: 'vermelho', motivo: `só ${g.cachePct}% do contexto veio do cache: a conversa foi reescrita (compact, troca de modelo ou de ferramentas) e cada mensagem custa mais até o cache voltar`, curto: 'cache refeito' }
  if (ctx >= 85) return { selo: 'Gastando à toa', cor: 'vermelho', motivo: `contexto em ${ctx}%: cada mensagem relê tudo`, curto: 'contexto alto' }
  if (frioAgora && ctx >= 20) return { selo: 'Atenção', cor: 'ambar', motivo: 'cache vencido: a próxima mensagem reescreve o contexto', curto: 'cache frio' }
  if (g.reconstruiu && ctx >= 20) return { selo: 'Atenção', cor: 'ambar', motivo: 'o cache venceu e foi reescrito neste turno', curto: 'cache reescrito' }
  if (ctx >= 70) return { selo: 'Atenção', cor: 'ambar', motivo: `contexto em ${ctx}%: perto da hora do handoff`, curto: 'contexto alto' }
  if (rel !== null && rel >= 1.6) return { selo: 'Atenção', cor: 'ambar', motivo: `este turno pesou ${rel.toFixed(1).replace('.', ',')}x o seu normal`, curto: 'turno acima do normal' }
  if (!g.reconstruiu && g.cachePct !== null && g.cachePct < 80) return { selo: 'Atenção', cor: 'ambar', motivo: `${g.cachePct}% do contexto veio do cache`, curto: 'cache baixo' }
  return { selo: 'Econômico', cor: 'lima', motivo: g.cachePct !== null ? `${g.cachePct}% do contexto veio do cache` : '', curto: '' }
}

/**
 * O selo final: a medição manda, e o Jev (quando respondeu com 70% de certeza ou mais) é a segunda opinião sobre os casos
 * que a medição não fecha (atenção ou desperdício). Ele pode rebaixar um aviso que se justifica (turno pesado de propósito)
 * ou confirmá-lo. Os fatos duros, contexto cheio e cache perdido, nunca são desfeitos por opinião.
 */
export function seloDoGasto(g: Gasto | null, contextoPct: number | null, agora: number): Selo | null {
  const base = seloMedido(g, contextoPct, agora)
  const j = g?.jev ?? null
  if (!base || !j || j.conf < 0.7 || base.curto === 'contexto alto' || base.curto === 'cache refeito') return base
  const pct = `${Math.round(j.conf * 100)}%`
  if (j.nivel === 'economico') return { selo: 'Econômico', cor: 'lima', motivo: `Jev ${pct}: gasto justificado (${base.motivo})`, curto: '' }
  if (j.nivel === 'atencao') return { selo: 'Atenção', cor: 'ambar', motivo: `Jev ${pct}: ${base.motivo}`, curto: base.curto || 'Jev' }
  return { selo: 'Gastando à toa', cor: 'vermelho', motivo: `Jev ${pct}: ${base.motivo}`, curto: base.curto || 'Jev' }
}

/** O orçamento do plano, à parte do selo: âmbar a partir de 75%, vermelho a partir de 90%. */
export function alertaLimite(lim: Limite | null, agora: number): { texto: string; cor: 'ambar' | 'vermelho'; motivo: string } | null {
  if (!lim || lim.pct < 75) return null
  const volta = lim.volta ? `, volta ${quandoVolta(lim.volta, agora)}` : ''
  return { texto: `limite ${lim.pct}%`, cor: lim.pct >= 90 ? 'vermelho' : 'ambar', motivo: `${lim.pct}% do limite ${lim.tipo}${volta}` }
}

export const ktok = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')}M` : `${Math.round(n / 1000)}k`)
export function relogio(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function escolher($: EngineInterface, e: Escolha) {
  await update($, escolha, () => e)
  $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const salvo = await $.store.get('auto').catch(() => undefined)
    if (typeof salvo === 'boolean') await update($, auto, () => salvo)
    void carregarTabela($)
    void lerUso($)
    const tique = () => $.clock.after(15_000, () => { $.ui.invalidate('ui.render'); tique() })
    tique()
    void $.command.register({ name: 'rota-esforco', description: 'ROTA esforço: auto, off, status, ou um nível (medio, alto, maximo).' }).catch(() => undefined)
    return next(e)
  })

  on('command.run', async ($, e, next) => {
    if (e.command !== 'rota-esforco') return next(e)
    const arg = semAcento(String(e.args ?? '').trim())
    if (arg === 'off' || arg === 'desligar') {
      await update($, auto, () => false)
      await $.store.set('auto', false)
      $.ui.invalidate('ui.render')
      return { text: 'ROTA esforço desligado: vale o esforço do app.' }
    }
    if (arg === 'teste' || arg === 'teste off') {
      await update($, teste, () => arg === 'teste')
      $.ui.invalidate('ui.render')
      return { text: arg === 'teste' ? 'Teste do fundo ligado: 3 faixas acima da caixa do chat. Mande um print. /rota-esforco teste off fecha.' : 'Teste do fundo fechado.' }
    }
    if (arg === 'jev on' || arg === 'jev off') {
      const quer = arg === 'jev on'
      await $.store.set('jev', quer)
      const tem = Boolean(await chaveJev($))
      return { text: quer ? (tem ? 'Jev ligado: segunda opinião sobre o gasto, só com números.' : 'Jev ligado, mas falta a chave: defina TYPESAFE_API_KEY no ambiente.') : 'Jev desligado: o selo usa só a medição.' }
    }
    if (arg === 'auto' || arg === 'ligar' || arg === 'on') {
      await update($, auto, () => true)
      await $.store.set('auto', true)
      $.ui.invalidate('ui.render')
      return { text: 'ROTA esforço ligado: cada mensagem é julgada.' }
    }
    const pedido = nivelPedido(`esforco ${arg}`)
    if (pedido) {
      await escolher($, { esforco: pedido, por: 'pedido', porque: 'você escolheu', categoria: null })
      return { text: `Esforço ${ROTULO[pedido]} até a próxima mensagem julgada.` }
    }
    await carregarTabela($)
    const atual = await read($, escolha)
    const g = await read($, gasto)
    const lim = await read($, limite)
    const pct = await read($, contexto)
    const agora = await $.clock.now().catch(() => Date.now())
    const selo = seloDoGasto(g, pct, agora)
    const aviso = alertaLimite(lim, agora)
    return {
      text: [
        selo ? `Gasto: ${selo.selo}${selo.motivo ? ` (${selo.motivo})` : ''}.` : 'Gasto: sem medida ainda.',
        g ? `Cache: ${g.cacheAte ? (agora > g.cacheAte ? 'frio' : `quente por mais ${relogio(g.cacheAte - agora)}`) : 'sem medida'}${g.cachePct !== null ? `, ${g.cachePct}% da última resposta veio dele` : ''}. Último turno: ${ktok(g.turnoTok)} tokens.` : '',
        pct !== null ? `Contexto: ${pct}% da janela.` : '',
        `Jev: ${((await $.store.get('jev').catch(() => undefined)) ?? true) === false ? 'desligado' : (await chaveJev($)) ? (g?.jev ? `${g.jev.nivel} (${Math.round(g.jev.conf * 100)}%)` : 'ligado, sem opinião neste turno') : 'sem chave (TYPESAFE_API_KEY)'}.`,
        aviso ? `Orçamento: ${aviso.motivo}.` : lim ? `Limite ${lim.tipo}: ${lim.pct}%.` : '',
        g?.relMediana != null ? `Turno: ${g.relMediana.toFixed(1)}x o seu normal (mediana dos seus últimos turnos).` : '',
        `ROTA esforço: ${(await read($, auto)) ? 'ligado' : 'desligado'}. Piso ${ROTULO[tabela.piso]}.`,
        atual ? `Agora: ${ROTULO[atual.esforco]} (${atual.por}: ${atual.porque}).` : 'Nenhuma mensagem julgada ainda.',
        `Tabela: ${tabela.categorias.length} categorias${tabela.atualizado ? `, de ${tabela.atualizado}` : ''} (${TABELA_URL}).`,
      ].filter(Boolean).join('\n'),
    }
  })

  on('prompt.submit', async ($, e, next) => {
    const pessoa = e.origin.kind === 'composer' || e.origin.kind === 'bridge' || e.origin.kind === 'sdk'
    if (!pessoa || e.text.trim().startsWith('/') || !(await read($, auto))) return next(e)
    const modelo = await $.session.model()
    if (!cacheSeguro(modelo)) return next(e)
    const antes = await read($, escolha)

    const pedido = nivelPedido(e.text)
    if (pedido) {
      await escolher($, { esforco: pedido, por: 'pedido', porque: 'você pediu', categoria: null })
      return next(e)
    }
    // "ok", "sim" entre dois passos mantêm o esforço, a não ser que a última resposta termine numa pergunta.
    const ctx = await contextoRecente($)
    if (antes && continuacao(e.text) && !e.attachments?.length && !ctx.slice(-400).includes('?')) {
      await escolher($, { ...antes, por: 'mantido', porque: 'continuação' })
      return next(e)
    }
    await carregarTabela($)
    const cat = classificar(e.text, tabela)
    if (cat) {
      const piso = cat.criativo ? maior(tabela.piso, 'high') : tabela.piso
      // Mesma categoria duas mensagens seguidas (ex.: segunda reprovação da peça): sobe e pede nova abordagem, não o mesmo refinamento.
      const repetiu = Boolean(cat.repetida && antes?.categoria === cat.nome && antes.por !== 'pedido')
      const base = repetiu && cat.repetida ? maior(cat.esforco, cat.repetida) : cat.esforco
      await escolher($, { esforco: limitado(base, piso, tabela.teto), por: 'tabela', porque: repetiu ? `repetiu: ${cat.porque}, tente outra abordagem` : cat.porque, categoria: cat.nome })
      return next(e)
    }
    await update($, decidindo, () => true)
    $.ui.invalidate('ui.render')
    try {
      const v = await perguntarHaiku($, e.text, antes?.esforco ?? null)
      if (v) await escolher($, { esforco: limitado(v.esforco, tabela.piso, tabela.teto), por: 'haiku', porque: v.porque, categoria: null })
      else await escolher($, { esforco: maior(antes?.esforco ?? tabela.piso, tabela.piso), por: 'piso', porque: tabela.categorias.length ? 'juiz sem resposta' : 'tabela e juiz sem resposta', categoria: null })
    } finally {
      await update($, decidindo, () => false)
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const principal = e.agentId === undefined
    // Toda resposta da conversa principal é medida: cache, tokens e peso.
    const enviar = async function* (req: typeof e) {
      const r = yield* next(req)
      if (principal && r?.usage) await anotarUso($, r.usage as Uso, e.index === 0).catch(() => undefined)
      return r
    }
    if (typeof e.effort !== 'string' || !cacheSeguro(e.model)) return yield* enviar(e)
    const p = await read($, escolha)
    if (!p || !(await read($, auto))) return yield* enviar(e)
    if (principal) return yield* enviar({ ...e, effort: p.esforco })
    // Subagente: só sobe até o piso, nunca desce o que a definição dele pediu.
    const atual = e.effort as Esforco
    return yield* next(idx(atual) < idx(tabela.piso) ? { ...e, effort: tabela.piso } : e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await fecharTurno($).catch(() => undefined)
    await lerUso($)
    $.ui.invalidate('ui.render')
    return r
  })

  // A faixa acima da caixa do chat: o R, o nível em lima, o modelo, o anel do contexto, o motivo e a chave Auto,
  // sobre o fundo do Motion Kit com a luz passando. Enquanto o juiz decide, a borda pulsa e três pixels piscam.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const Svg = 'Svg' in els ? els.Svg : undefined
    if (Svg && (await read($, teste))) {
      const agoraT = await $.clock.now().catch(() => Date.now())
      const tira = (chave: string, rotulo: string, fonte: string, largura: number, altura: number) => (
        <Box key={chave} position="relative" flexDirection="row" alignItems="center" paddingX={1} overflow="hidden" backgroundColor={T.fundo} borderStyle="round" borderColor={T.bordaViva}>
          <Box key={`${chave}-arte`} position="absolute" top={-1} right={0} bottom={-1}>
            <Svg source={fonte} alt={`teste ${chave}`} width={largura} height={altura} />
          </Box>
          <Text color={T.lima} bold>{rotulo}</Text>
        </Box>
      )
      return (
        <Box key="rota-teste" flexDirection="column">
          {tira('tb', 'A: 420x46, fonte fixa', fundoEm('atencao', 0), FUNDO_W, FUNDO_H)}
          {tira('tc', 'B: 420x46, com fase do relógio', fundoEm('atencao', agoraT), FUNDO_W, FUNDO_H)}
          {tira('td', 'C: controle mínimo (2 quadrados)', FUNDO_CONTROLE, FUNDO_W, FUNDO_H)}
        </Box>
      )
    }
    const ligado = await read($, auto)
    const p = await read($, escolha)
    const julgando = await read($, decidindo)
    const pct = await read($, contexto)
    const mod = await read($, modelo)
    const palavra = !ligado ? 'Off' : julgando ? 'Decidindo' : p ? ROTULO[p.esforco] : 'Auto'
    const g = await read($, gasto)
    const agora = await $.clock.now().catch(() => Date.now())
    const lim = await read($, limite)
    const selo = seloDoGasto(g, pct, agora)
    const aviso = alertaLimite(lim, agora)
    const estado: Estado = julgando ? 'decidindo' : selo?.cor === 'vermelho' ? 'gastando' : selo?.cor === 'ambar' ? 'atencao' : 'economico'
    const fundoArte = fundoEm(estado, agora)
    const cor = COR_ESTADO[estado]
    const corSelo = selo ? T[selo.cor] : T.rotulo
    const alternar = async () => {
      const novo = !(await read($, auto))
      await update($, auto, () => novo)
      await $.store.set('auto', novo)
      $.ui.invalidate('ui.render')
    }
    if (!Svg) {
      return (
        <Box key="rota" flexDirection="row" gap={1} paddingX={1} borderStyle="round" borderColor={ligado ? T.bordaViva : T.borda}>
          <Text color={ligado ? T.lima : T.rotulo} bold>{`ROTA esforço: ${palavra}`}</Text>
          {selo ? <Text color={corSelo} bold>{selo.selo}</Text> : null}
          {aviso ? <Text color={T[aviso.cor]}>{aviso.texto}</Text> : null}
          <Box flexGrow={1} />
          <Button key="rota-auto" plain label={ligado ? 'Auto ligado' : 'Auto desligado'} onPress={alternar} />
        </Box>
      )
    }
    return (
      <Box key="rota" position="relative" flexDirection="row" alignItems="center" paddingX={1} overflow="hidden"
        backgroundColor={ligado ? cor.fundo : T.fundo} borderStyle="round" borderColor={ligado ? cor.borda : T.borda}>
        {ligado ? (
          <Box key={`rota-arte-${estado}`} position="absolute" top={-1} right={0} bottom={-1}>
            <Svg source={fundoArte} alt="ROTA, fundo animado de jogo de pixel" width={FUNDO_W} height={FUNDO_H} />
          </Box>
        ) : null}
        <Box key="rota-palavras" position="relative" flexDirection="row" flexGrow={1} flexShrink={1} minWidth={0} overflow="hidden" alignItems="center">
          <Box flexShrink={0} flexDirection="row" alignItems="center">
            <Box flexShrink={0} marginRight={1} alignItems="center">
              <Svg source={ligado ? MARCA_SVG : MARCA_OFF_SVG} alt="ROTA" width={18} height={18} />
            </Box>
            {ligado && !julgando ? <Text color={T.rotulo}>{'Esforço '}</Text> : null}
            <Text key="rota-nivel" color={ligado ? T.lima : T.rotulo} bold>{palavra}</Text>
            {julgando ? (
              <Box flexShrink={0} marginLeft={1} alignItems="center">
                <Svg source={PONTOS_SVG} alt="decidindo" width={PONTOS_W} height={8} />
              </Box>
            ) : null}
          </Box>
          {pct !== null ? (
            <Box flexShrink={0} marginLeft={2} flexDirection="row" gap={1} alignItems="center">
              <Svg source={anelSvg(pct, T.texto)} alt={`${pct}% do contexto`} width={16} height={16} />
              <Text color={T.texto}>{`${pct}%`}</Text>
            </Box>
          ) : null}
          {selo ? (
            <Box flexShrink={0} marginLeft={2} flexDirection="row" gap={1} alignItems="center">
              <Text color={corSelo} bold>{selo.selo}</Text>
              {selo.cor !== 'lima' && selo.curto ? <Text color={T.rotulo}>{selo.curto}</Text> : null}
            </Box>
          ) : null}
          {aviso ? (
            <Box flexShrink={0} marginLeft={2}>
              <Text color={T[aviso.cor]} bold>{aviso.texto}</Text>
            </Box>
          ) : null}
        </Box>
        <Box minWidth={1} />
        <Box key="rota-acoes" flexShrink={0} flexDirection="row" gap={1} alignItems="center" marginLeft={1}>
          <Box position="absolute" top={0} left={0} />
          <Box key="rota-chave" position="relative" flexDirection="row" alignItems="center" gap={1} paddingX={1}>
            <Svg source={chaveSvg(ligado)} alt={ligado ? 'Auto ligado' : 'Auto desligado'} width={26} height={15} />
            <Text color={ligado ? T.texto : T.rotulo}>Auto</Text>
            <Box position="absolute" top={0} bottom={0} left={0} right={0} alignItems="stretch" justifyContent="center">
              <Button key="rota-auto" plain label={'\u00a0'.repeat(14)} hover={{ scope: 'rota-auto', backgroundColor: '#00000000' }} onPress={alternar} />
            </Box>
          </Box>
        </Box>
      </Box>
    )
  })
}
