<p align="center">
  <img src="assets/hero.svg" width="100%" alt="MCP ROTA v0.2.3: workflows, skills e régua de qualidade da ROTA para qualquer agente">
</p>

# MCP ROTA

O MCP ROTA reúne os workflows, as skills e a régua de qualidade da [ROTA](https://rotasaas.com) num contrato só, que Claude, Codex e qualquer agente MCP conseguem ler.

- **Contrato de início:** cada sessão começa com as regras que valem para aquele projeto e tarefa, em cerca de 3 mil tokens, sem reler arquivos.
- **Régua com origem:** toda regra traz um nível de verificabilidade. V3 é veredito literal, V2 é medida. Regra viva é padrão observado, não lei.
- **Casos reais:** só entra o que foi aprovado, com a frase literal de quem aprovou.
- **Esforço por tarefa:** uma tabela de roteamento diz quanto raciocínio cada tipo de trabalho pede. Piso médio; trabalho criativo de régua alta fica em high.
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

## Ferramentas

Todas são só leitura e vêm marcadas com `readOnlyHint` e título.

| Ferramenta | O que devolve |
|---|---|
| `rota_inicio` | com projeto e tarefa, o contrato de início: regras confirmadas (V2+) das áreas da tarefa, sem duplicata, skills, progresso, últimos vereditos, o que já foi reprovado e o esforço sugerido. Sem parâmetros, o briefing geral |
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
| 0.2.3 | 17/11/2026 | `rota_rotear` e a tabela de roteamento de esforço (pública em `https://mcp.rotasaas.com/roteamento.json`); o contrato de início traz o esforço sugerido |
| 0.2.2 | 16/11/2026 | respostas 58% menores (JSON compacto, resumo por padrão, paginação), erros que dizem como corrigir, OAuth só com login de pessoa |
| 0.2.1 | 16/11/2026 | descrições das ferramentas dentro da política do Diretório; títulos e páginas públicas |
| 0.2.0 | 16/11/2026 | conector online com login da ROTA, contrato de início e régua filtrada |

O acervo, as skills e a CLI ficam no repositório privado do time, `rota-scale/rota-workflows`.

Licença do plugin: MIT.
