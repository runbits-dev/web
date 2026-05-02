/**
 * WebAuthn / Passkeys browser helpers.
 *
 * Registration: caller must already be authenticated (a Bearer token in
 * localStorage). Authentication: caller is anonymous and supplies an email.
 *
 * Both helpers wrap @simplewebauthn/browser's startRegistration/startAuthentication
 * and pair them with the runbits-auth-service /auth/webauthn/* endpoints.
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type RegisteredPasskey = {
  id: string
  credentialId: string
  deviceType: string | null
  backedUp: boolean
  deviceName: string | null
  createdAt: number
}

/**
 * Register a new passkey for the currently-signed-in user.
 *
 * @param name - Friendly device name shown later in the credential list.
 * @returns The credential record persisted by the backend.
 */
export async function registerPasskey(name: string): Promise<RegisteredPasskey> {
  // 1. Ask the backend for registration options + a one-shot challengeId.
  const optsRes = await fetch(`${API_BASE}/api/auth/webauthn/register/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!optsRes.ok) {
    const err = await optsRes.json().catch(() => ({}))
    throw new Error(err.error || 'No se pudieron obtener las opciones de registro')
  }
  const { options, challengeId } = await optsRes.json() as { options: any; challengeId: string }

  // 2. Have the browser/authenticator create the credential.
  let attResp
  try {
    attResp = await startRegistration({ optionsJSON: options })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'InvalidStateError') {
      throw new Error('Este dispositivo ya tiene una passkey registrada para esta cuenta')
    }
    throw err instanceof Error ? err : new Error('Error al crear la passkey')
  }

  // 3. POST the attestation back to the server for verification + persistence.
  const verifyRes = await fetch(`${API_BASE}/api/auth/webauthn/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ challengeId, response: attResp, deviceName: name }),
  })
  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}))
    throw new Error(err.error || 'No se pudo verificar la passkey')
  }
  const data = await verifyRes.json() as { verified: boolean; credential: RegisteredPasskey }
  return data.credential
}

export type PasskeyLoginResult = {
  token: string
  refreshToken?: string
  account: { id: string; email: string; phone?: string | null; name: string }
}

/**
 * Sign in via passkey. Email is required so the server can return the
 * caller's allowed credential IDs in the assertion options.
 */
export async function loginWithPasskey(email: string): Promise<PasskeyLoginResult> {
  // 1. Get authentication options + challengeId.
  const optsRes = await fetch(`${API_BASE}/api/auth/webauthn/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!optsRes.ok) {
    const err = await optsRes.json().catch(() => ({}))
    throw new Error(err.error || 'No se pudieron obtener las opciones de inicio de sesión')
  }
  const { options, challengeId } = await optsRes.json() as { options: any; challengeId: string }

  // 2. Have the browser unlock the passkey and produce an assertion.
  let assertion
  try {
    assertion = await startAuthentication({ optionsJSON: options })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotAllowedError') {
      throw new Error('Inicio de sesión cancelado o sin passkey disponible para este email')
    }
    throw err instanceof Error ? err : new Error('Error al firmar con la passkey')
  }

  // 3. Verify the assertion — server issues a JWT on success.
  const verifyRes = await fetch(`${API_BASE}/api/auth/webauthn/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, response: assertion }),
  })
  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}))
    throw new Error(err.error || 'Inicio de sesión con passkey falló')
  }
  return await verifyRes.json() as PasskeyLoginResult
}

/** Returns true if this browser exposes the WebAuthn API. */
export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined'
}
