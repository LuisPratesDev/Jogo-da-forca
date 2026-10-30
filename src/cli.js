import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Coordinator } from "./coordinator.js";
import { ModelClient } from "./agent.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const task = process.argv.slice(2).join(" ").trim();

if (!task) {
  console.error('Uso: npm start -- "descreva a tarefa para os agentes"');
  process.exitCode = 2;
} else {
  try {
    const coordinator = new Coordinator({ client: new ModelClient(), root });
    const report = await coordinator.run(task);
    await mkdir(path.join(root, "generated"), { recursive: true });
    await writeFile(path.join(root, "generated", "pipeline-report.md"), report, "utf8");
    console.log(report);
    console.log("\nRelatório salvo em generated/pipeline-report.md");
  } catch (error) {
    console.error(`Falha no pipeline: ${error.message}`);
    process.exitCode = 1;
  }
}