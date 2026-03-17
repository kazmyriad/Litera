const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function handleResponse(raw: string, res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw}`);
  return JSON.parse(raw);
}

export async function fetchUserById(id:number) {
  const res = await fetch(`${API_BASE}/api/users/${id}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function checkUniqueUsernameEmail(username?: string, email?: string, id?: number) {
  if (!username && !email) {
    throw new Error('username or email required for uniqueness check');
  }

  const params = new URLSearchParams();
  if (username) params.set('username', username);
  if (email) params.set('email', email);
  if (id !== undefined) params.set('id', String(id));

  const res = await fetch(`${API_BASE}/api/users/check-unique?${params.toString()}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function updateUserInformation(
  id: number,
  username: string,
  firstname: string,
  lastname: string,
  email: string,
  dob: string
) {
  const dobValue = dob ? dob : null;
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, firstname, lastname, email, dob: dobValue })
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}