const SECRET = process.env.SESSION_SECRET!

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload = btoa(JSON.stringify({ userId }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payload}.${sigB64}`
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null

  const key = await getKey()

  // Re-pad base64url → base64 standard pour atob
  const padded = sig.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    sig.length + (4 - sig.length % 4) % 4, '='
  )
  const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))

  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload))
  if (!valid) return null

  try {
    const paddedPayload = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      payload.length + (4 - payload.length % 4) % 4, '='
    )
    return JSON.parse(atob(paddedPayload))
  } catch {
    return null
  }
}