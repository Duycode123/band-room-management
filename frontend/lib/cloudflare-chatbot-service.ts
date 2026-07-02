import api from '@/lib/api'

export type ChatbotSuggestedRoom = {
  roomId?: number
  id?: number
  roomName: string
  roomTypeName?: string
  roomType?: {
    typeName?: string
    pricePerHour?: number | string | null
    capacity?: number | null
  } | null
  pricePerHour?: number | string | null
  capacity?: number | null
  status?: string | null
  reason?: string | null
}

export type ChatbotReply = {
  answer: string
  suggestedRooms: ChatbotSuggestedRoom[]
  suggestedQuestions: string[]
  usedAi?: boolean
  mode?: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const workerBaseUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_CHATBOT_URL?.replace(/\/$/, '')

export async function sendChatbotMessage(message: string): Promise<ChatbotReply> {
  if (workerBaseUrl) {
    const response = await fetch(`${workerBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    const payload = (await response.json()) as ApiEnvelope<ChatbotReply>
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Chatbot chua phan hoi duoc')
    }

    return {
      answer: payload.data.answer,
      suggestedRooms: payload.data.suggestedRooms ?? [],
      suggestedQuestions: payload.data.suggestedQuestions ?? [],
      usedAi: true,
      mode: payload.data.mode ?? 'CLOUDFLARE_WORKER',
    }
  }

  const response = await api.post<ApiEnvelope<ChatbotReply>>('/api/ai/chat', { message })
  return response.data.data
}

export async function getChatbotSuggestedQuestions(): Promise<string[]> {
  if (workerBaseUrl) {
    const response = await fetch(`${workerBaseUrl}/suggested-questions`)
    const payload = (await response.json()) as ApiEnvelope<string[]>
    if (!response.ok || !payload.success) {
      return []
    }
    return payload.data
  }

  const response = await api.get<ApiEnvelope<string[]>>('/api/ai/suggested-questions')
  return response.data.data
}
