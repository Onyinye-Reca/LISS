const base = (process.env.API_BASE ?? "http://localhost:4000").replace(/\/$/, "");

async function main() {
  const res = await fetch(`${base}/health/`, {
    headers: { Accept: "application/json" },
  });

  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }

  if (!res.ok || !parsed?.ok) {
    console.error("[smoke:api] failed", {
      url: `${base}/health/`,
      status: res.status,
      body: parsed,
    });
    process.exit(1);
  }

  console.log("[smoke:api] ok", {
    url: `${base}/health/`,
    status: res.status,
    body: parsed,
  });
}

main().catch((err) => {
  console.error("[smoke:api] error", err);
  process.exit(1);
});
