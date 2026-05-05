const apiServer = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!apiServer) {
  throw new Error('Missing required env: NEXT_PUBLIC_API_URL');
}

if (!apiServer.startsWith('http://') && !apiServer.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_API_URL must start with http:// or https://');
}

export const API_SERVER_URL = apiServer.replace(/\/$/, '');
