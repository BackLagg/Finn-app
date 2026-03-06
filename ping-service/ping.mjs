const PING_URLS = (process.env.PING_URLS || '').split(',').map((u) => u.trim()).filter(Boolean);

async function ping(url) {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000) });
    console.log(`${url} -> ${res.status}`);
    return true;
  } catch (err) {
    console.warn(`${url} -> ${err.message}`);
    return false;
  }
}

async function main() {
  if (PING_URLS.length === 0) {
    console.warn('PING_URLS is empty, nothing to ping');
    process.exit(0);
    return;
  }
  console.log(`Pinging ${PING_URLS.length} URL(s)...`);
  const results = await Promise.all(PING_URLS.map(ping));
  const ok = results.filter(Boolean).length;
  console.log(`Done: ${ok}/${PING_URLS.length} succeeded`);
  process.exit(ok > 0 ? 0 : 1);
}

main();
