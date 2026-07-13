export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  suggestedRoomIds?: number[]
}

export type QuickReply = {
  id: string
  label: string
  message: string
}

export type ChatHistoryTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatbotSendOptions = {
  history?: ChatHistoryTurn[]
  excludeRoomIds?: number[]
}

export type ChatbotReply = {
  content: string
  quickReplies?: QuickReply[]
  usedAi?: boolean
  mode?: string
  suggestedRoomIds?: number[]
}
