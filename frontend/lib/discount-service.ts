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

export async function validateDiscountCode({
  code,
}: ValidateDiscountCodeParams): Promise<DiscountValidationResult> {
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return {
      valid: false,
      message: 'Vui long nhap ma giam gia.',
    }
  }

  return {
    valid: false,
    message: 'Backend hien chua ho tro contract discount cho flow nay.',
  }
}
