# rota-esforco

Mod do Claude Code que escolhe sozinho o esforço de raciocínio de cada mensagem e desenha, acima da caixa do chat, uma faixa animada em estilo de jogo de pixel: o nível em lima, o anel do contexto e um selo que diz se a sessão está gastando bem.

```
/plugin install rota-esforco --marketplace rota-scale/mcp-rota
```

Mods são um recurso de acesso antecipado do Claude Code: confira se a sua versão tem mods habilitados.

## Como decide

O mod decide **a cada mensagem que você envia**, e esse esforço vale para todos os passos do turno. Ordem:

1. **Nível pedido na mensagem** ("esforço máximo", "coloca em médio") vale sempre.
2. **Continuação curta** ("ok", "pode") mantém o esforço.
3. **Disse que não serviu** ("não funcionou", "de novo"): sobe um nível, até xhigh. O esforço começa no menor que costuma resolver e sobe só quando falha.
4. **Tabela de roteamento** pública, em `https://mcp.rotasaas.com/roteamento.json`. Categorias de tema (design, som, motion, edição, 3D, geração paga, estudo) só valem se a mensagem **pede trabalho** (cria, faz, edita, estuda): "o design está no ar" não puxa esforço alto. Código começa em médio; risco (segurança, segredo, apagar, dinheiro, produção) fica em high.
5. **Comentário curto sem pedido de trabalho nem pergunta:** piso médio, sem gastar chamada.
6. **Haiku da própria sessão**, para o que a tabela não cobre; dúvida fica em médio.

O texto das suas mensagens fica na sua máquina. O modelo da conversa nunca é trocado: trocar reescreve o cache e custa mais do que economiza.

## A faixa

Um fundo de Game Boy muda com o gasto: lima calmo, âmbar (atenção) e vermelho em disparada.

- **Esforço Alto** (lima): o turno está rodando com esse esforço. Parado, vira **Último esforço**, em cinza: é o do último turno, não uma decisão nova.
- **Último turno Atenção · turno caro:** o turno que acabou pesou mais de 2,5x o seu normal. Turno longo de trabalho pesa assim; só é desperdício se o contexto passar de 85% (vermelho) ou o Jev confirmar.
- O limite do seu plano aparece à parte, como aviso de orçamento.
- **Eficiência:** `/rota-esforco eficiencia` mostra o custo por acerto de cada nível, com os dados só no seu computador, e só recomenda com 12 turnos por nível.

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
