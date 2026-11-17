# rota-esforco

Mod do Claude Code que escolhe sozinho o esforço de raciocínio de cada mensagem e desenha, acima da caixa do chat, uma faixa animada em estilo de jogo de pixel: o nível em lima, o anel do contexto e um selo que diz se a sessão está gastando bem.

```
/plugin install rota-esforco --marketplace rota-scale/mcp-rota
```

Mods são um recurso de acesso antecipado do Claude Code: confira se a sua versão tem mods habilitados.

## Como decide

1. **Nível pedido na mensagem** ("esforço máximo", "effort high") vale sempre.
2. **Continuação curta** ("ok", "sim") mantém o esforço que já estava.
3. **Tabela de roteamento** pública, em `https://mcp.rotasaas.com/roteamento.json`: 11 categorias (motion, edição, som, 3D, design, geração paga, código, estudo e outras). Piso médio, trabalho criativo de régua alta em alto, estudo e auditoria em muito alto.
4. **Haiku da própria sessão**, quando a mensagem não bate com nenhuma categoria.

O texto das suas mensagens fica na sua máquina. O modelo da conversa nunca é trocado: trocar reescreve o cache e custa mais do que economiza.

## A faixa

Um fundo de Game Boy muda com o gasto: lima calmo (econômico), âmbar (atenção) e vermelho em disparada (gastando à toa). Enquanto decide, uma barra de pixels carrega.

O selo mede **desperdício**, não consumo, comparando cada turno com o seu próprio histórico: turno bem acima do seu normal, cache perdido sem ter vencido, contexto cheio. O limite do seu plano aparece à parte, como aviso. `/rota-esforco status` mostra os detalhes.

## Comandos

| Comando | O que faz |
|---|---|
| `/rota-esforco status` | selo, cache, contexto, limite e a tabela em uso |
| `/rota-esforco auto` · `off` | liga e desliga |
| `/rota-esforco medio` · `alto` · `maximo` | fixa um nível até a próxima mensagem julgada |
| `/rota-esforco jev on` · `jev off` | segunda opinião opcional sobre o gasto (abaixo) |

## Jev (opcional)

Se existir `TYPESAFE_API_KEY` no ambiente, o selo pode pedir uma segunda opinião ao Jev, da TypeSafe. Só saem números (esforço usado, tipo de trabalho, % de contexto, % de cache, peso do turno), nunca texto. Sem a chave, nada acontece.

## O que é público e o que é do time

Este plugin é público e funciona sozinho. O [MCP ROTA](https://github.com/rota-scale/mcp-rota) acrescenta, para quem tem acesso à conta da ROTA, a tabela completa com as fontes internas e os workflows. Esses abrem só com o login do time.

## Licença

MIT. Partes adaptadas do [effortless](https://github.com/HeyCubit/effortless), de HeyCubit, também MIT. Ver `NOTICE.md`.

Testes: `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test plugin-esforco`.
