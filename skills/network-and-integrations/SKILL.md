---
name: network-and-integrations
description: Audita dependências e comunicação de rede direta ou indireta e opera integrações externas em modo de leitura.
---

# Redes e integrações

Identifique fetch/XHR/WebSocket, imports remotos, SDKs, analytics, fontes, imagens externas, service workers, formulários, redirects, DNS/configuração de deploy e dependências que iniciam tráfego indireto. Registre destino, finalidade, dados enviados, autenticação, tratamento de erro e controles de origem/CSP quando aplicável.

Não exponha tokens nem faça chamadas ou alterações remotas além das consultas explicitamente autorizadas. Considere CORS corretamente: é uma política aplicada pelo navegador, não autenticação. Diferencie risco comprovado de hipótese e informe o caminho do código.