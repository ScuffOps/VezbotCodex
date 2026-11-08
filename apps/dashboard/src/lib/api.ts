/// <reference types="node" />

const API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.BOT_API_SECRET;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Make an authenticated request to the Bot API
 */
export async function fetchBotApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!API_SECRET) {
    console.error('BOT_API_SECRET is not configured');
    return { error: 'Server configuration error' };
  }

  try {
    const res = await fetch(`${API_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
        ...options.headers,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return { error: 'Not found' };
      if (res.status === 401) return { error: 'Unauthorized' };
      const error = await res.text();
      return { error: `API Error: ${error}` };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error('Bot API request failed:', err);
    return { error: 'Failed to connect to bot' };
  }
}
