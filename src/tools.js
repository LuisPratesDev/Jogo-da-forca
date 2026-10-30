import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);
const excludedDirectories = new Set([".git", "node_modules", "generated"]);
const secretName = /(^|\/)(\.env(?:\..*)?|[^/]*(?:secret|credential|private[-_]?key)[^/]*|[^/]*\.(?:pem|key))$/i;
const MAX_FILE_BYTES = 200_000;

async function safePath(root, requested, mustExist = true) {
  if (typeof requested !== "string" || !requested || path.isAbsolute(requested)) {
    throw new Error("Informe um caminho relativo ao workspace.");
  }
  const target = path.resolve(root, requested);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative) || secretName.test(relative.replaceAll("\\", "/"))) {
    throw new Error("Caminho fora do escopo permitido.");
  }
  const resolved = await realpath(target).catch(async (error) => {
    if (mustExist || error.code !== "ENOENT") throw error;
    const parent = await realpath(path.dirname(target));
    const parentRelative = path.relative(root, parent);
    if (parentRelative.startsWith("..") || path.isAbsolute(parentRelative)) throw new Error("Caminho fora do workspace.");
    return target;
  });
  const actualRelative = path.relative(root, resolved);
  if (actualRelative.startsWith("..") || path.isAbsolute(actualRelative)) throw new Error("Caminho fora do workspace.");
  return target;
}

async function listFiles(root, directory = "", results = []) {
  const current = path.resolve(root, directory);
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || excludedDirectories.has(entry.name)) continue;
    const relative = path.posix.join(directory.replaceAll("\\", "/"), entry.name);
    if (secretName.test(relative)) continue;
    if (entry.isDirectory()) await listFiles(root, relative, results);
    else if (entry.isFile()) results.push(relative);
    if (results.length >= 2_000) return results;
  }
  return results;
}

function definitionsFor(mode, integration) {
  const common = [
    { type: "function", function: { name: "list_files", description: "Lista arquivos do workspace sem incluir segredos ou dependências.", parameters: { type: "object", properties: {} } } },
    { type: "function", function: { name: "read_file", description: "Lê um arquivo de texto do workspace.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
    { type: "function", function: { name: "search_code", description: "Busca texto nos arquivos do workspace.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  ];
  if (mode === "edit") {
    common.push(
      { type: "function", function: { name: "replace_in_file", description: "Substitui uma ocorrência exata e única em arquivo existente.", parameters: { type: "object", properties: { path: { type: "string" }, old_text: { type: "string" }, new_text: { type: "string" } }, required: ["path", "old_text", "new_text"] } } },
      { type: "function", function: { name: "run_tests", description: "Executa somente npm test, com limite de 60 segundos.", parameters: { type: "object", properties: {} } } },
    );
  }
  if (integration === "github") {
    common.push(
      { type: "function", function: { name: "github_repository", description: "Consulta os metadados do repositório configurado.", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "github_workflows", description: "Consulta execuções recentes de workflows.", parameters: { type: "object", properties: {} } } },
    );
  }
  if (integration === "cloudflare") {
    common.push(
      { type: "function", function: { name: "cloudflare_account", description: "Consulta a conta Cloudflare configurada.", parameters: { type: "object", properties: {} } } },
      { type: "function", function: { name: "cloudflare_workers", description: "Lista Workers da conta Cloudflare configurada.", parameters: { type: "object", properties: {} } } },
    );
  }
  return common;
}

export function createToolset({ root, mode = "read", integration, integrations }) {
  const definitions = definitionsFor(mode, integration);
  async function execute(name, args) {
    if (name === "list_files") return (await listFiles(root)).join("\n") || "Nenhum arquivo encontrado.";
    if (name === "read_file") {
      const target = await safePath(root, args.path);
      const info = await stat(target);
      if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error("Arquivo inválido ou maior que 200 KB.");
      return readFile(target, "utf8");
    }
    if (name === "search_code") {
      const query = String(args.query ?? "").toLowerCase();
      if (!query) throw new Error("A busca não pode ser vazia.");
      const matches = [];
      for (const file of await listFiles(root)) {
        if (secretName.test(file)) continue;
        const target = await safePath(root, file);
        const info = await stat(target);
        if (info.size > MAX_FILE_BYTES) continue;
        const lines = (await readFile(target, "utf8")).split(/\r?\n/);
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query) && matches.length < 100) matches.push(`${file}:${index + 1}: ${line.slice(0, 300)}`);
        });
        if (matches.length >= 100) break;
      }
      return matches.join("\n") || "Nenhuma ocorrência encontrada.";
    }
    if (name === "replace_in_file") {
      if (mode !== "edit") throw new Error("Este agente é somente leitura.");
      const target = await safePath(root, args.path);
      const source = await readFile(target, "utf8");
      const firstIndex = source.indexOf(args.old_text);
      if (!args.old_text || firstIndex === -1 || source.indexOf(args.old_text, firstIndex + 1) !== -1) {
        throw new Error("O trecho antigo deve ocorrer exatamente uma vez; leia novamente e tente um contexto menor.");
      }
      await writeFile(target, source.replace(args.old_text, args.new_text), "utf8");
      return `Atualizado: ${args.path}`;
    }
    if (name === "run_tests") {
      if (mode !== "edit") throw new Error("Este agente não pode executar testes.");
      const command = process.platform === "win32" ? "npm.cmd" : "npm";
      const result = await execFileAsync(command, ["test"], { cwd: root, timeout: 60_000, maxBuffer: 1_000_000, shell: process.platform === "win32" });
      return `${result.stdout}\n${result.stderr}`.trim() || "npm test concluído sem saída.";
    }
    if (name.startsWith("github_")) return integrations.github[name.slice("github_".length)]();
    if (name.startsWith("cloudflare_")) return integrations.cloudflare[name.slice("cloudflare_".length)]();
    throw new Error(`Ferramenta desconhecida: ${name}`);
  }
  return { definitions, execute };
}