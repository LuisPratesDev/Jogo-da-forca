import { readFile } from "node:fs/promises";
import path from "node:path";
import { createToolset } from "./tools.js";

const MAX_TOOL_ROUNDS = 8;
const MAX_OUTPUT = 12_000;

export class ModelClient {
  constructor(env = process.env) {
    this.baseUrl = (env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    this.apiKey = env.AI_API_KEY || env.GROQ_API_KEY || env.OPENAI_API_KEY;
    this.model = env.AI_MODEL;
    if (!this.apiKey || !this.model) throw new Error("Configure AI_API_KEY (ou GROQ_API_KEY/OPENAI_API_KEY) e AI_MODEL.");
  }

  async complete(messages, tools) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, tools, tool_choice: "auto", temperature: 0.2 }),
    });
    if (!response.ok) throw new Error(`API de IA respondeu HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    return response.json();
  }
}

export class Agent {
  constructor({ role, client, root, integrations }) {
    Object.assign(this, { role, client, root, integrations });
  }

  async run({ task, artifacts = [] }) {
    const skillPath = path.join(this.root, "skills", this.role.skill, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    const tools = createToolset({ root: this.root, mode: this.role.mode, integration: this.role.integration, integrations: this.integrations });
    const history = artifacts.slice(-8).map((artifact) => `### ${artifact.label}\n${artifact.output.slice(0, 2_000)}`).join("\n\n");
    const messages = [
      { role: "system", content: `Você é ${this.role.label}. Trabalhe em português, seja específico e colabore com os resultados anteriores. Preserve o padrão existente.\n\n${skill}\n\nUse ferramentas conforme necessário. Nunca tente ler segredos nem executar ações remotas de escrita. Se editar arquivos, faça alterações pequenas e rode npm test quando apropriado.` },
      { role: "user", content: `Tarefa:\n${task}\n\nResultados compartilhados dos outros agentes:\n${history || "Nenhum resultado anterior."}` },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const result = await this.client.complete(messages, tools.definitions);
      const message = result.choices?.[0]?.message;
      if (!message) throw new Error("Resposta inválida da API de IA.");
      messages.push(message);
      if (!message.tool_calls?.length) return String(message.content ?? "").slice(0, MAX_OUTPUT);
      for (const call of message.tool_calls) {
        let value;
        try {
          const args = JSON.parse(call.function.arguments || "{}");
          value = await tools.execute(call.function.name, args);
        } catch (error) {
          value = `Erro da ferramenta: ${error.message}`;
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: String(typeof value === "string" ? value : JSON.stringify(value)).slice(0, MAX_OUTPUT) });
      }
    }
    return "Limite de chamadas de ferramenta atingido; revise os resultados parciais no workspace.";
  }
}