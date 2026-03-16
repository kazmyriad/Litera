export async function fetchUserById(id = 1) {
  const base = import.meta.env.VITE_API_BASE ?? '';
  const res = await fetch(`${base}/api/users/${id}`);
  const raw = await res.text();
  console.log('API /api/users/', id, { status: res.status, text: raw.slice(0, 300) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${raw}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON from /api/users/${id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}