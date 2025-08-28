// lib/json.ts
// Parser JSON aman: tidak melempar "Unexpected end of JSON input"
// Bila response bukan JSON / body kosong, kita kembalikan null atau { _text: string }.
export async function parseJsonSafe(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    const txt = await res.text();
    return txt ? { _text: txt } : null;
  } catch {
    return null;
  }
}
