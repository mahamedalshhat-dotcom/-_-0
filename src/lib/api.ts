/**
 * Shared API utilities for Noor Al-Haq
 */

export async function fetchWithRetry(url: string, retries = 3, timeout = 15000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      
      if (res.ok) return res;
      
      // If 403, the proxy or source is blocking us, don't bother retrying this specific URL/Proxy
      if (res.status === 403) {
        throw new Error(`Access Forbidden (403) for ${url}`);
      }
      
      console.warn(`Fetch failed with status ${res.status}, retrying... (${i + 1}/${retries})`);
    } catch (e) {
      clearTimeout(id);
      // If it's a 403 error we just threw, don't retry
      if (e instanceof Error && e.message.includes('403')) throw e;
      
      if (i === retries - 1) throw e;
      console.warn(`Fetch error: ${e}, retrying... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function fetchBlobWithRetry(url: string, retries = 3, timeout = 15000): Promise<Blob> {
  const res = await fetchWithRetry(url, retries, timeout);
  const blob = await res.blob();
  if (blob.size < 50000) {
    throw new Error("Downloaded file is too small (likely an error page)");
  }
  return blob;
}
