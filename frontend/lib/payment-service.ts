export type PaymentMethod = 'bank_transfer' | 'e_wallet' | 'cash'

export type PaymentStatus = 'success' | 'failed' | 'pending' | 'cancelled'

export type CreatePaymentSessionPayload = {
  bookingId: string
  amount: number
  method: PaymentMethod
}

export type CreatePaymentSessionResponse = {
  paymentUrl: string
  paymentId: string
  status: PaymentStatus
}

const mockDelay = 900

export async function createPaymentSession(
  payload: CreatePaymentSessionPayload,
): Promise<CreatePaymentSessionResponse> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, mockDelay))

  if (!payload.bookingId || !payload.amount || !payload.method) {
    throw new Error('Không thể tạo giao dịch. Vui lòng kiểm tra lại thông tin thanh toán.')
  }

  const status: PaymentStatus = payload.method === 'cash' ? 'pending' : 'success'
  const searchParams = new URLSearchParams({
    bookingId: payload.bookingId,
    status,
    method: payload.method,
    amount: String(payload.amount),
  })

  return {
    paymentUrl: `/payment/return?${searchParams.toString()}`,
    paymentId: `PAY-${Date.now()}`,
    status,
  }
}
