export type Esforco = 'low' | 'medium' | 'high' | 'xhigh' | 'max'
export type Gasto = {
  cacheAte: number | null
  ttl: '5m' | '1h'
  cachePct: number | null
  turnoTok: number
  turnoPeso: number
  sessaoPeso: number
  reconstruiu: boolean
  relMediana: number | null
  jev: { nivel: 'economico' | 'atencao' | 'gastando'; conf: number } | null
}
export type Limite = { pct: number; tipo: string; volta: string | null }
export type Escolha = {
  esforco: Esforco
  por: 'tabela' | 'haiku' | 'pedido' | 'mantido' | 'piso'
  porque: string
  categoria: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'rota-esforco': { escolha: Escolha | null; decidindo: boolean; auto: boolean; contexto: number | null; modelo: string | null; gasto: Gasto | null; limite: Limite | null }
  }
}
