import test from "node:test";
import assert from "node:assert/strict";
import { roles, reviewers, routeFinding, getRole } from "../src/roles.js";
import { parseAssignments } from "../src/coordinator.js";

test("registra os dezesseis papéis solicitados", () => {
  assert.equal(roles.length, 16);
  assert.equal(new Set(roles.map((role) => role.id)).size, roles.length);
  assert.equal(reviewers.length, 7);
  assert.equal(getRole("cloudflare-integrator").integration, "cloudflare");
  assert.equal(getRole("github-integrator").integration, "github");
});

test("encaminha achados às áreas desenvolvedoras correspondentes", () => {
  assert.equal(routeFinding("Erro de contraste no layout CSS"), "css-developer");
  assert.equal(routeFinding("Estado JavaScript não trata a exceção"), "javascript-developer");
  assert.equal(routeFinding("HTML semântico sem rótulo acessível"), "html-developer");
});

test("aceita somente agentes desenvolvedores ao processar encaminhamentos", () => {
  const assignments = parseAssignments('[{"agent":"css-developer","finding":"contraste insuficiente"},{"agent":"unknown","finding":"ignorar"}]');
  assert.deepEqual(assignments, [{ agent: "css-developer", finding: "contraste insuficiente" }]);
});