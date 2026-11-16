<p align="center">
  <img src="assets/hero.svg" width="100%" alt="MCP ROTA: workflows, skills e régua de qualidade da ROTA para qualquer agente">
</p>

# MCP ROTA

O MCP ROTA reúne os workflows, as skills e a régua de qualidade da [ROTA](https://rotasaas.com) num contrato só, que Claude, Codex e qualquer agente MCP conseguem ler.

- **Contrato de início:** cada sessão começa com as regras que valem para aquele projeto e tarefa, em cerca de 3 mil tokens, sem reler arquivos.
- **Régua com origem:** toda regra traz um nível de verificabilidade. V3 é veredito literal, V2 é medida. Regra viva é padrão observado, não lei.
- **Casos reais:** só entra o que foi aprovado, com a frase literal de quem aprovou.
- **Três portas, um contrato:** a CLI `rota`, o servidor MCP e as skills leem os mesmos dados.

## Conectar (time ROTA)

1. Claude > **Settings > Connectors > Add > Custom connector**.
2. URL: `https://mcp.rotasaas.com/mcp`.
3. **Entrar com o Google da ROTA** e **Permitir**.

Só entra conta do domínio da ROTA. O acervo, as skills e a CLI ficam no repositório privado do time, `rota-scale/rota-workflows`.

Versão atual: **0.2.0** (16/11/2026).
