export type DiscountValidationResult = {
  valid: boolean
  code?: string
  discountAmount?: number
  message: string
}

export type AppliedDiscount = {
  code: string
  discountAmount: number
}

type ValidateDiscountCodeParams = {
  code: string
  subtotal: number
  bookingId?: string
  roomId?: string
}

const mockDiscountCodes: Record<string, { type: 'fixed' | 'percent'; value: number }> = {
  BAND50: { type: 'fixed', value: 50000 },
  BAND10: { type: 'percent', value: 10 },
  NEWUSER: { type: 'fixed', value: 30000 },
}

export async function validateDiscountCode({
  code,
  subtotal,
}: ValidateDiscountCodeParams): Promise<DiscountValidationResult> {
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return {
      valid: false,
      message: 'Vui lòng nhập mã giảm giá.',
    }
  }

  await new Promise((resolve) => globalThis.setTimeout(resolve, 220))

  const discount = mockDiscountCodes[normalizedCode]
  if (!discount) {
    return {
      valid: false,
      message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
    }
  }

  const rawDiscountAmount =
    discount.type === 'percent' ? Math.round((subtotal * discount.value) / 100) : discount.value
  const discountAmount = Math.min(Math.max(0, rawDiscountAmount), subtotal)

  return {
    valid: true,
    code: normalizedCode,
    discountAmount,
    message: 'Áp dụng mã giảm giá thành công',
  }
}
