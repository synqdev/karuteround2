/**
 * Quick Reserve API client.
 * Direct API calls — no Puppeteer needed.
 *
 * Timestamps are Unix ms. Dates in JST.
 */

const QR_API_BASE = 'https://api.quick-reserve.com/v1/console'

export interface QRReservation {
  id: number
  store_id: number
  customer_id: number
  treatment_course_id: number
  staff_id: number
  booth_id: number
  start_at: number          // Unix ms
  end_at: number            // Unix ms
  request: string
  deleted: boolean
  rid: string
  is_new_customer_flag: boolean
  nominated_staff_id: number | null
  Customer: {
    id: number
    name: string
    name_kana: string
    phone1: string
    mail1: string
    remarks1: string
    visits_number_cache: number
    is_existing_customer: boolean
  }
  Staff: {
    id: number
    name: string
    name_kana: string
  }
  TreatmentCourse: {
    id: number
    name: string
    duration: number        // ms
    price: number
    treatment_category_id: number
  }
}

export interface QRStaff {
  id: number
  name: string
  name_kana: string
}

interface QRSession {
  token: string
  cookies: string
}

/**
 * Log into Quick Reserve console and get session.
 */
export async function qrLogin(username: string, password: string): Promise<QRSession> {
  // Try JSON login first
  const res = await fetch(`${QR_API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: username, password }),
    redirect: 'manual',
  })

  const cookies = res.headers.get('set-cookie') ?? ''
  let token = ''

  try {
    const data = await res.json()
    token = data.token ?? data.access_token ?? ''
  } catch {
    // Some APIs return token in cookie only
  }

  if (!res.ok && res.status !== 302) {
    // Try form-encoded
    const res2 = await fetch(`${QR_API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ login_id: username, password }),
      redirect: 'manual',
    })

    const cookies2 = res2.headers.get('set-cookie') ?? ''
    try {
      const data2 = await res2.json()
      token = data2.token ?? data2.access_token ?? ''
    } catch {}

    return { token, cookies: cookies2 }
  }

  return { token, cookies }
}

function qrHeaders(session: QRSession): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session.token) h['Authorization'] = `Bearer ${session.token}`
  if (session.cookies) h['Cookie'] = session.cookies
  return h
}

/**
 * Fetch reservations for a date. The endpoint returns full objects
 * with nested Customer, Staff, and TreatmentCourse.
 */
export async function qrGetReservations(
  session: QRSession,
  storeSlug: string,
  storeId: number,
  date: string, // YYYY-MM-DD
): Promise<QRReservation[]> {
  const headers = qrHeaders(session)

  // Try GET with query params
  const url = `${QR_API_BASE}/${storeSlug}/${storeId}/get-customer-reservations?date=${date}`
  const res = await fetch(url, { headers })

  if (res.ok) {
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  // Try POST
  const res2 = await fetch(`${QR_API_BASE}/${storeSlug}/${storeId}/get-customer-reservations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ date }),
  })

  if (res2.ok) {
    const data = await res2.json()
    return Array.isArray(data) ? data : []
  }

  throw new Error(`QR get-reservations failed: ${res2.status}`)
}

/**
 * Convert QR reservation to our appointment fields.
 */
export function mapReservation(r: QRReservation) {
  return {
    qrId: r.id,
    qrRid: r.rid,
    customerName: r.Customer.name,
    customerKana: r.Customer.name_kana,
    customerPhone: r.Customer.phone1,
    customerNotes: r.Customer.remarks1,
    customerVisits: r.Customer.visits_number_cache,
    isNewCustomer: r.is_new_customer_flag || !r.Customer.is_existing_customer,
    staffName: r.Staff.name,
    staffQrId: r.Staff.id,
    treatmentName: r.TreatmentCourse.name,
    startTime: new Date(r.start_at).toISOString(),
    endTime: new Date(r.end_at).toISOString(),
    durationMinutes: Math.round((r.end_at - r.start_at) / 60000),
  }
}
