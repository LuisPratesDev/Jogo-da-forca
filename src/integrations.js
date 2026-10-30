async function getJson(url, token, headers = {}) {
  if (!token) throw new Error("Credencial da integração ausente; configure o .env.");
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, ...headers } });
  if (!response.ok) throw new Error(`API externa respondeu HTTP ${response.status}.`);
  return response.json();
}

export function createIntegrations(env = process.env) {
  const [owner, repository] = (env.GITHUB_REPOSITORY ?? "").split("/");
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  return {
    github: {
      repository: async () => {
        if (!owner || !repository) throw new Error("Configure GITHUB_REPOSITORY=owner/repository.");
        return getJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, env.GITHUB_TOKEN, { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" });
      },
      workflows: async () => {
        if (!owner || !repository) throw new Error("Configure GITHUB_REPOSITORY=owner/repository.");
        return getJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/runs?per_page=10`, env.GITHUB_TOKEN, { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" });
      },
    },
    cloudflare: {
      account: async () => {
        if (!accountId) throw new Error("Configure CLOUDFLARE_ACCOUNT_ID.");
        return getJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`, env.CLOUDFLARE_API_TOKEN);
      },
      workers: async () => {
        if (!accountId) throw new Error("Configure CLOUDFLARE_ACCOUNT_ID.");
        return getJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`, env.CLOUDFLARE_API_TOKEN);
      },
    },
  };
}