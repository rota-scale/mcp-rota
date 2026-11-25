<p align="center">
  <img src="assets/hero.svg" width="100%" alt="MCP ROTA v0.2.10: workflows, skills e régua de qualidade da ROTA para qualquer agente">
</p>

# MCP ROTA

O MCP ROTA reúne os workflows, as skills e a régua de qualidade da [ROTA](https://rotasaas.com) num contrato só, que Claude, Codex e qualquer agente MCP conseguem ler.

- **Contrato de início:** cada sessão começa com as regras que valem para aquele projeto e tarefa, em cerca de 3 mil tokens, sem reler arquivos.
- **Régua com origem:** toda regra traz um nível de verificabilidade. V3 é veredito literal, V2 é medida. Regra viva é padrão observado, não lei.
- **Casos reais:** só entra o que foi aprovado, com a frase literal de quem aprovou.
- **Esforço por tarefa:** uma tabela de roteamento diz quanto raciocínio cada tipo de trabalho pede. Piso médio; código começa em médio e sobe só quando falha; trabalho criativo de régua alta e risco (segurança, apagar, dinheiro, produção) ficam em high. Tema citado sem pedido de trabalho não sobe o esforço.
- **Três portas, um contrato:** a CLI `rota`, o servidor MCP e as skills leem os mesmos dados.

## Conectar (time ROTA)

1. Claude > **Settings > Connectors > Add > Custom connector**.
2. URL: `https://mcp.rotasaas.com/mcp`.
3. **Entrar com o Google da ROTA** e **Permitir**.

No Claude Code:

```
claude mcp add --transport http rota https://mcp.rotasaas.com/mcp
```

Primeira chamada de toda sessão: `rota_inicio` com o projeto e a tarefa (ex.: `projeto: 016`, `tarefa: motion`).

**Plugin opcional para o Claude Code**, que mostra o ícone da ROTA em cada chamada:

```
/plugin install rota --marketplace rota-scale/mcp-rota
```

## Plugin de esforço (público)

O plugin `rota-esforco` escolhe sozinho o esforço de raciocínio de cada mensagem e mostra, acima da caixa do chat, uma faixa animada de jogo de pixel com o nível, o contexto e o gasto da sessão. Funciona para qualquer pessoa, sem conta da ROTA:

```
/plugin install rota-esforco --marketplace rota-scale/mcp-rota
```

O MCP ROTA, com a tabela completa e os workflows, abre só para quem tem acesso à conta da ROTA. Detalhes em [`plugin-esforco/README.md`](plugin-esforco/README.md).

## Ferramentas

Todas são só leitura e vêm marcadas com `readOnlyHint` e título.

| Ferramenta | O que devolve |
|---|---|
| `rota_inicio` | com projeto e tarefa, o contrato de início: regras confirmadas (V2+) das áreas da tarefa, sem duplicata, skills, progresso, últimos vereditos, o que já foi reprovado, o esforço sugerido e, quando a tarefa tem conector próprio (3D, por exemplo), o conector com estado e como conferir. Sem parâmetros, o briefing geral |
| `rota_regua` | régua por área, filtrada por estado e etapa (`secao`), compacta e paginada |
| `rota_rotear` | esforço e modelo sugeridos para uma mensagem ou tarefa, com o motivo e a fonte |
| `rota_caso` | casos aprovados: veredito literal, o que funcionou e as etapas |
| `rota_templates` · `rota_matriz` | templates de workflow e skill, e o que já tem prova por meio |
| `rota_skills` | catálogo de skills resumido, ou o `SKILL.md` de uma |
| `rota_biblioteca` | motions aprovados, resumidos por padrão; o id traz a ficha inteira |
| `rota_referencias` | imagens de referência: contagem por grupo, ou 30 por página com `tema` |
| `rota_buscar` · `rota_prompt` | busca no acervo e prompts aprovados |
| `rota_capacidades` · `rota_projetos` · `rota_conectores` | ferramentas do time com data de checagem, projetos ativos e conectores |

`rota_veredito`, que grava o veredito literal no projeto, roda só no MCP local do time. Gravar pelo servidor está no plano da v0.3.

## Login e segurança

- **OAuth 2.1 com PKCE:** só contas Google do domínio da ROTA entram, e o token vale só para este servidor.
- **Clientes:** só os do Claude e do Claude Code, por Client ID Metadata Document. Não há registro dinâmico nem token de máquina sem usuário.
- **Validação do emissor:** o servidor responde com `iss` (RFC 9207).
- **Dados:** ficam no Postgres da ROTA. Nenhuma ferramenta gera mídia, move dinheiro ou chama API paga.
- **Páginas públicas:** [documentação](https://mcp.rotasaas.com/docs) · [privacidade](https://mcp.rotasaas.com/privacidade) · [saúde](https://mcp.rotasaas.com/saude).
- **Suporte:** rota@rotasaas.com.

## Diretório de conectores do Claude

Enviado em 16/11/2026 como **MCP ROTA**, em revisão pela Anthropic. A ficha vai aparecer no catálogo, mas o login continua restrito ao time da ROTA.

## Versões

| Versão | Data | O que mudou |
|---|---|---|
| 0.2.10 | 18/11/2026 | o esforço só sobe com pedido de trabalho (cria, faz, edita, estuda), não por palavra de tema; comentário curto fica no piso médio; a regra vale em toda sessão conectada, com ou sem o plugin (`rota-esforco` 0.1.6) |
| 0.2.9 | 18/11/2026 | faixa do `rota-esforco` 0.1.5: parada, mostra o último esforço e o último turno sem alarme; turno caro vira atenção, não desperdício |
| 0.2.8 | 18/11/2026 | esforço medido: código começa em médio e sobe um nível só quando falha; livro-razão de eficiência guardado só no computador da pessoa (`rota-esforco` 0.1.4) |
| 0.2.7 | 18/11/2026 | categoria `risco-alto` (segurança, segredo, apagar, dinheiro, produção) em high no mínimo; segunda reprovação seguida sobe para xhigh; teto público de 2 rodadas (`rota-esforco` 0.1.3) |
| 0.2.6 | 17/11/2026 | categoria `pergunta`: dúvida sem pedido de trabalho fica em esforço médio |
| 0.2.5 | 17/11/2026 | fundo animado do `rota-esforco` no tamanho da faixa, em SVG compacto e com texto alternativo |
| 0.2.4 | 17/11/2026 | a tabela pública de roteamento traz só categoria, esforço, padrões e motivo genérico; entra o plugin público `rota-esforco` |
| 0.2.3 | 17/11/2026 | `rota_rotear` e a tabela de roteamento de esforço (pública em `https://mcp.rotasaas.com/roteamento.json`); o contrato de início traz o esforço sugerido |
| 0.2.2 | 16/11/2026 | respostas 58% menores (JSON compacto, resumo por padrão, paginação), erros que dizem como corrigir, OAuth só com login de pessoa |
| 0.2.1 | 16/11/2026 | descrições das ferramentas dentro da política do Diretório; títulos e páginas públicas |
| 0.2.0 | 16/11/2026 | conector online com login da ROTA, contrato de início e régua filtrada |

O acervo, as skills e a CLI ficam no repositório privado do time, `rota-scale/rota-workflows`.

Licença do plugin: MIT.
