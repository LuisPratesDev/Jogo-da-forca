import { Agent } from "./agent.js";
import { createIntegrations } from "./integrations.js";
import { developers, getRole, reviewerForDeveloper, reviewers, routeFinding } from "./roles.js";

function parseAssignments(output) {
  const json = output.match(/\[[\s\S]*\]/)?.[0];
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => developers.includes(item.agent) && typeof item.finding === "string");
  } catch {
    return [];
  }
}

export class Coordinator {
  constructor({ client, root }) {
    this.client = client;
    this.root = root;
    this.integrations = createIntegrations();
    this.artifacts = [];
  }

  async call(id, task) {
    const role = getRole(id);
    const output = await new Agent({ role, client: this.client, root: this.root, integrations: this.integrations }).run({ task, artifacts: this.artifacts });
    this.artifacts.push({ id, label: role.label, output });
    return output;
  }

  async run(task) {
    const stages = ["structure-planner", "page-designer", "svg-creator", "html-developer", "css-developer", "javascript-developer"];
    for (const id of stages) await this.call(id, task);

    const lowerTask = task.toLowerCase();
    if (lowerTask.includes("github")) await this.call("github-integrator", task);
    if (lowerTask.includes("cloudflare")) await this.call("cloudflare-integrator", task);
    for (const id of reviewers) await this.call(id, task);

    const findings = this.artifacts.filter((item) => reviewers.includes(item.id)).map((item) => `## ${item.label}\n${item.output}`).join("\n\n");
    const dispatch = await this.call("error-router", `Analise os achados abaixo. Retorne somente um array JSON de objetos {"agent":"<id do desenvolvedor>","finding":"<problema e correção objetiva>"}. Use apenas estes ids: ${developers.join(", ")}. Ignore elogios e itens sem ação.\n\n${findings}`);
    const assignments = parseAssignments(dispatch);
    const routed = assignments.length ? assignments : findings.split(/\n(?=## )/).filter((entry) => entry.trim()).map((finding) => ({ agent: routeFinding(finding), finding }));
    const unique = [...new Map(routed.map((entry) => [`${entry.agent}:${entry.finding}`, entry])).values()];
    const changedDevelopers = new Set();
    for (const assignment of unique.slice(0, 12)) {
      const result = await this.call(assignment.agent, `Corrija este achado de revisão com a menor alteração necessária. Não altere arquivos fora do workspace.\n\n${assignment.finding}`);
      if (!result.toLowerCase().includes("nenhuma alteração") && !result.toLowerCase().includes("sem alteração")) changedDevelopers.add(assignment.agent);
    }
    for (const developer of changedDevelopers) await this.call(reviewerForDeveloper[developer], `Revise novamente o escopo após estas correções. Relate somente problemas ainda presentes.\n\nTarefa original: ${task}`);

    return this.report(task);
  }

  report(task) {
    const sections = this.artifacts.map((item) => `## ${item.label}\n\n${item.output}`).join("\n\n");
    return `# Relatório do pipeline\n\nTarefa: ${task}\n\n${sections}\n`;
  }
}

export { parseAssignments };