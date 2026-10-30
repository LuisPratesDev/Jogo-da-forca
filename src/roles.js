export const roles = [
  { id: "page-designer", label: "Designer da página", skill: "design-and-review", mode: "read" },
  { id: "design-reviewer", label: "Revisor de design", skill: "design-and-review", mode: "read" },
  { id: "structure-planner", label: "Planejador da estrutura do código", skill: "architecture-and-flow", mode: "read" },
  { id: "structure-reviewer", label: "Revisor do fluxo da estrutura", skill: "architecture-and-flow", mode: "read" },
  { id: "svg-creator", label: "Criador profissional de SVG", skill: "web-implementation", mode: "edit" },
  { id: "html-developer", label: "Desenvolvedor sênior de HTML", skill: "web-implementation", mode: "edit" },
  { id: "html-reviewer", label: "Revisor da estrutura HTML", skill: "web-implementation", mode: "read" },
  { id: "javascript-developer", label: "Desenvolvedor sênior de JavaScript", skill: "javascript-quality", mode: "edit" },
  { id: "javascript-reviewer", label: "Revisor sênior de JavaScript", skill: "javascript-quality", mode: "read" },
  { id: "css-developer", label: "Desenvolvedor de CSS", skill: "web-implementation", mode: "edit" },
  { id: "css-reviewer", label: "Revisor sênior de CSS", skill: "web-implementation", mode: "read" },
  { id: "network-reviewer", label: "Revisor de redes e conexões", skill: "network-and-integrations", mode: "read" },
  { id: "cloudflare-integrator", label: "Agente Cloudflare", skill: "network-and-integrations", mode: "read", integration: "cloudflare" },
  { id: "github-integrator", label: "Agente GitHub", skill: "network-and-integrations", mode: "read", integration: "github" },
  { id: "project-reviewer", label: "Revisor detalhado do projeto", skill: "project-audit-and-routing", mode: "read" },
  { id: "error-router", label: "Responsável pelo encaminhamento de erros", skill: "project-audit-and-routing", mode: "read" },
];

export const reviewers = [
  "design-reviewer",
  "structure-reviewer",
  "html-reviewer",
  "css-reviewer",
  "javascript-reviewer",
  "network-reviewer",
  "project-reviewer",
];

export const developers = ["html-developer", "css-developer", "javascript-developer", "svg-creator"];

export const reviewerForDeveloper = {
  "html-developer": "html-reviewer",
  "css-developer": "css-reviewer",
  "javascript-developer": "javascript-reviewer",
  "svg-creator": "html-reviewer",
};

export function getRole(id) {
  const role = roles.find((item) => item.id === id);
  if (!role) throw new Error(`Papel de agente desconhecido: ${id}`);
  return role;
}

export function routeFinding(finding) {
  const text = finding.toLowerCase();
  if (/svg|html|sem[aâ]ntic|acessib|dom/.test(text)) return "html-developer";
  if (/css|estilo|layout|responsiv|contraste|visual/.test(text)) return "css-developer";
  if (/javascript|\bjs\b|l[oó]gica|evento|estado|teste|exce[cç][aã]o/.test(text)) return "javascript-developer";
  if (/ícone|icon|vetor|ilustra[cç][aã]o/.test(text)) return "svg-creator";
  return "javascript-developer";
}