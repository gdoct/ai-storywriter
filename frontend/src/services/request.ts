export async function getResponse(url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', token: string, body?: any) {
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      throw new Error(`Invalid or missing JWT token '${token}' for ${method} ${url}`);
    }
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch ${url}: ${response.status} ${errorText}`);
        if (response.status !== 404) {
          throw new Error(`Failed to fetch ${url}: ${response.status} ${errorText}`);
        }
      }
      return response;
    } catch {
      console.error(`Error fetching ${method} ${url}`);
      throw new Error(`Error fetching ${url}`);
    }
  }
export async function getJsonResponse(url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', token: string, body?: any) {
    const response = await getResponse(url, method, token, body);
    return response.json();
  }
export async function getTextResponse(url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', token: string, body?: any) {
    const response = await getResponse(url, method, token, body);
    return response.text();
  }