// All communication with your Node backend goes through this one file.
// In development, Vite forwards /api/... to your server (see vite.config.js).

export function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
