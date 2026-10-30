# Jogo-da-forca: equipe de agentes de IA

Orquestrador em JavaScript/Node.js para planejar, implementar e revisar projetos web com agentes especializados. Os agentes compartilham um diario de execucao, podem ler e alterar arquivos do workspace de forma confinada e encaminham achados de revisao aos desenvolvedores responsaveis.

## Agentes

| Papel | Responsabilidade |
|---|---|
| Designer da página e revisor de design | Identidade visual, consistencia e acessibilidade |
| Planejador e revisor de estrutura | Modulos, dependencias e fluxo entre componentes |
| Criador de SVG | SVGs acessiveis, escalaveis e seguros |
| Desenvolvedor sênior de HTML e revisor | Semantica, estrutura e acessibilidade HTML |
| Desenvolvedor sênior de JavaScript e revisor | Logica, erros, manutencao e testes |
| Desenvolvedor de CSS e revisor | Layout responsivo, design tokens e compatibilidade |
| Revisor de redes | Chamadas, dependencias, politicas e exposicao de dados |
| Integradores Cloudflare e GitHub | Consulta de recursos e status de conta/repositorio |
| Revisor do projeto | Auditoria integrada de todos os arquivos e fluxos |
| Roteador de erros | Encaminha problemas encontrados ao agente desenvolvedor adequado |

Os integradores externos sao ativados apenas quando a tarefa os menciona e usam endpoints de leitura. Nenhum deploy, publicacao, issue ou alteracao remota e executado automaticamente.

## Skills

As skills locais estao em `skills/<nome>/SKILL.md` e seguem o formato aberto Agent Skills. Elas cobrem arquitetura, design e revisao, HTML/CSS/SVG, JavaScript, redes/integracoes e auditoria/encaminhamento.

Skill pronta encontrada no GitHub: [anthropics/skills - frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design/SKILL.md). O projeto referencia a skill como fonte de pesquisa sem redistribuir seu conteudo. Tambem consultamos [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) e [cloudflare/agents](https://github.com/cloudflare/agents), que fornecem exemplos de formato de skills e infraestrutura, mas nao cobrem todos os papeis solicitados.

## Requisitos e configuracao

- Node.js 20 ou superior
- Uma API compativel com OpenAI Chat Completions (por exemplo, Groq)
- Tokens opcionais para consultas GitHub ou Cloudflare

Copie `.env.example` para `.env` e preencha as variaveis necessarias. Nunca compartilhe ou versione `.env`.

```powershell
npm test
npm start -- "Revise e implemente um jogo da forca acessivel em HTML, CSS e JavaScript"
```

Configuracao de IA: `AI_BASE_URL`, `AI_API_KEY` (ou `GROQ_API_KEY`/`OPENAI_API_KEY`) e `AI_MODEL`. Para integrar os provedores opcionais, configure `GITHUB_TOKEN` e `GITHUB_REPOSITORY=org/repo`, ou `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.

## Seguranca e fluxo

- Ferramentas de arquivo recusam caminhos fora do workspace, arquivos secretos e substituicoes ambíguas.
- Agentes desenvolvedores podem editar usando substituicoes exatas; revisores sao somente leitura.
- `run_tests` executa apenas `npm test` no workspace, com limite de tempo.
- GitHub e Cloudflare sao consultas autenticadas somente de leitura.
- A coordenacao faz uma rodada de revisao, encaminhamento e nova revisao; limite de iteracoes evita loops.
- Relatorios ficam em `generated/pipeline-report.md`.

O pipeline consome chamadas de modelo conforme os agentes acionados. Os agentes de integracao so participam se a tarefa mencionar explicitamente GitHub ou Cloudflare.