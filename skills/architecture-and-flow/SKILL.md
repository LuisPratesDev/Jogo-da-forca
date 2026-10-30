---
name: architecture-and-flow
description: Planeja módulos e dependências e revisa se os fluxos de dados e controle são corretos.
---

# Arquitetura e fluxo

Inspecione os pontos de entrada, dependências e convenções atuais. Proponha a menor estrutura que separa responsabilidades sem abstrações prematuras. Descreva fluxo de dados, estados, erros e limites entre módulos.

Na revisão, siga o caminho real de execução desde a entrada até o efeito observável. Procure ciclos, estados impossíveis, dependências invertidas, caminhos de erro ignorados, duplicação de fonte de verdade e contratos incompatíveis. Fundamente cada achado em código verificável.