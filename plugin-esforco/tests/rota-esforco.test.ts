import { expect, test } from 'claude-code/testing'

import { alertaLimite, classificar, continuacao, estadoParaJev, limitado, medianaDe, nivelPedido, relatorioEficiencia, retrabalho, seloDoGasto, semAcento, subirUm } from '../hooks/register'

const TABELA = {
  piso: 'medium' as const,
  teto: 'max' as const,
  categorias: [
    { id: 'motion', nome: 'motion no After Effects', esforco: 'high' as const, criativo: true, padroes: ['\\b(after|motion|transic\\w*)\\b'], porque: 'régua alta' },
    { id: 'pergunta', nome: 'pergunta', esforco: 'medium' as const, padroes: ['^(?!.*\\b(faz|fazer|cria|criar|corrig\\w*)\\b)(?:.{0,220}\\?|(?:por ?que|como|qual)\\b.{0,180})\\s*$'], porque: 'dúvida' },
    { id: 'risco-alto', nome: 'risco alto', esforco: 'high' as const, padroes: ['\\b(senha|apagar|em producao|pagamento)\\b'], porque: 'sensível' },
    { id: 'conversa', nome: 'conversa', esforco: 'medium' as const, padroes: ['^(obrigad[oa]|valeu)\\b'], porque: 'piso' },
  ],
}

test('piso médio: nada desce de medium nem passa do teto', async () => {
  expect(limitado('low', 'medium', 'max')).toBe('medium')
  expect(limitado('max', 'medium', 'high')).toBe('high')
  expect(limitado('xhigh', 'medium', 'max')).toBe('xhigh')
})

test('nível pedido na mensagem vale, em português e em inglês', async () => {
  expect(nivelPedido('faz isso com esforço máximo')).toBe('max')
  expect(nivelPedido('effort: high por favor')).toBe('high')
  expect(nivelPedido('pensa com calma nessa')).toBe('xhigh')
  expect(nivelPedido('Acho que deveria ta medium')).toBe('medium')
  expect(nivelPedido('coloca em alto')).toBe('high')
  expect(nivelPedido('ajusta o motion')).toBe(undefined)
})

test('continuação curta e tabela por texto sem acento', async () => {
  expect(continuacao('pode seguir')).toBe(true)
  expect(continuacao('ajusta a transição do after')).toBe(false)
  expect(semAcento('Transição')).toBe('transicao')
  expect(classificar('ajusta a transição no After', TABELA)?.id).toBe('motion')
  expect(classificar('valeu!', TABELA)?.id).toBe('conversa')
  expect(classificar('porque estamos usando o contexto alto? acho que deveria ta medium', TABELA)?.id).toBe('pergunta')
  expect(classificar('cria o plugin e faz o deploy', TABELA)?.id).not.toBe('pergunta')
  expect(classificar('apagar a pasta antiga do banco', TABELA)?.id).toBe('risco-alto')
})

const FAIXA = {
  plugin: 'rota-esforco',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 6, bodyColumns: 100, scroll: { offset: 0, bodyRows: 6 }, view: {} },
} as const

test('a faixa desenha no desktop e no terminal, e a chave desliga', async ($, on) => {
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...FAIXA, surface })
    expect(await ui.find({ type: 'Text', text: /Auto|ROTA Auto/ })).toBeTruthy()
    await ui.press({ key: 'rota-auto' })
    expect(await ui.find({ type: 'Text', text: /Off/ })).toBeTruthy()
    await ui.press({ key: 'rota-auto' })
    await ui.unmount()
  }
})

test('selo mede desperdício com o histórico; o limite é um aviso à parte', async () => {
  const g = { cacheAte: 1000, ttl: '1h' as const, cachePct: 95, turnoTok: 50_000, turnoPeso: 40_000, sessaoPeso: 10, reconstruiu: false, relMediana: 1.0, jev: null }
  expect(seloDoGasto(g, 30, 500)?.selo).toBe('Econômico')
  expect(seloDoGasto({ ...g, relMediana: 1.8 }, 30, 500)?.selo).toBe('Atenção')
  expect(seloDoGasto({ ...g, relMediana: 3.1 }, 30, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto({ ...g, relMediana: 3.1, turnoPeso: 5_000 }, 30, 500)?.selo).toBe('Econômico')
  expect(seloDoGasto(g, 72, 500)?.selo).toBe('Atenção')
  expect(seloDoGasto(g, 90, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto(g, 30, 2000)?.selo).toBe('Atenção')
  expect(seloDoGasto({ ...g, cachePct: 30 }, 40, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto({ ...g, cachePct: 30, reconstruiu: true }, 40, 500)?.selo).toBe('Atenção')
  expect(seloDoGasto(null, 40, 500)).toBe(null)
  expect(alertaLimite({ pct: 93, tipo: 'semanal', volta: null }, 0)?.cor).toBe('vermelho')
  expect(alertaLimite({ pct: 80, tipo: 'semanal', volta: null }, 0)?.cor).toBe('ambar')
  expect(alertaLimite({ pct: 60, tipo: 'semanal', volta: null }, 0)).toBe(null)
  expect(medianaDe([10, 30, 20, 100])).toBe(25)
})

test('Jev: só números saem; a opinião rebaixa aviso justificado mas não desfaz fato duro', async () => {
  const g = { cacheAte: 1000, ttl: '1h' as const, cachePct: 95, turnoTok: 50_000, turnoPeso: 60_000, sessaoPeso: 10, reconstruiu: false, relMediana: 3.2, jev: null }
  const e = estadoParaJev(g, 40, 'high', 'motion no After Effects')
  const tipos = Object.entries(e).filter(([k]) => k !== 'task').map(([, v]) => typeof v)
  expect(tipos.every(t => t === 'number' || t === 'boolean' || t === 'string' || t === 'object')).toBe(true)
  expect(JSON.stringify(Object.keys(e).sort())).toBe(JSON.stringify(['cache_had_expired', 'cache_share_percent', 'context_percent', 'effort_used', 'kind_of_work', 'task', 'turn_weight_units', 'turn_weight_vs_median'].sort()))
  expect(seloDoGasto(g, 40, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto({ ...g, jev: { nivel: 'economico', conf: 0.9 } }, 40, 500)?.selo).toBe('Econômico')
  expect(seloDoGasto({ ...g, jev: { nivel: 'economico', conf: 0.5 } }, 40, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto({ ...g, relMediana: 1.0, jev: { nivel: 'economico', conf: 0.95 } }, 90, 500)?.selo).toBe('Gastando à toa')
  expect(seloDoGasto({ ...g, cachePct: 20, relMediana: 1.0, jev: { nivel: 'economico', conf: 0.95 } }, 40, 500)?.selo).toBe('Gastando à toa')
})

test('retrabalho sobe um nível só com mensagem curta de falha, e o relatório compara custo por acerto', async () => {
  expect(retrabalho('não funcionou, deu erro de novo')).toBe(true)
  expect(retrabalho('ainda errado')).toBe(true)
  expect(retrabalho('cria o plugin e faz o deploy')).toBe(false)
  expect(retrabalho(`o botão ficou errado ${'x'.repeat(300)}`)).toBe(false)
  expect(subirUm('medium')).toBe('high')
  expect(subirUm('xhigh')).toBe('xhigh')
  expect(relatorioEficiencia([])).toContain('ainda sem turnos')
  const razao = [
    ...Array.from({ length: 12 }, () => ({ c: 'codigo', e: 'medium' as const, p: 100_000 })),
    ...Array.from({ length: 12 }, (_, i) => ({ c: 'codigo', e: 'high' as const, p: 250_000, ...(i < 1 ? { r: true as const } : {}) })),
  ]
  const r = relatorioEficiencia(razao)
  expect(r).toContain('codigo · medium: 12 turnos, retrabalho 0%')
  expect(r).toContain('o mais barato por acerto é medium')
  expect(relatorioEficiencia(razao.slice(0, 5))).toContain('ainda sem base')
})
