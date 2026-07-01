'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ChatbotReply,
  type ChatbotSuggestedRoom,
  getChatbotSuggestedQuestions,
  sendChatbotMessage,
} from '@/lib/cloudflare-chatbot-service'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  rooms?: ChatbotSuggestedRoom[]
}

const defaultQuestions = [
  'Toi di 4 nguoi, nen chon phong nao?',
  'Co phong nao duoi 200k mot gio khong?',
  'Phong re nhat hien tai la phong nao?',
  'Toi muon dat phong toi nay, con phong nao trong?',
]

export default function CloudflareChatbotClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Chao ban, minh co the tu van phong tap theo so nguoi, ngan sach va khung gio ban muon dat.',
    },
  ])
  const [input, setInput] = useState('')
  const [questions, setQuestions] = useState<string[]>(defaultQuestions)
  const [isSending, setIsSending] = useState(false)
  const [lastReply, setLastReply] = useState<ChatbotReply | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void getChatbotSuggestedQuestions().then((items) => {
      if (items.length > 0) {
        setQuestions(items)
      }
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending])

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending])

  async function submitMessage(nextMessage?: string) {
    const message = (nextMessage ?? input).trim()
    if (!message || isSending) return

    setInput('')
    setIsSending(true)
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', content: message },
    ])

    try {
      const reply = await sendChatbotMessage(message)
      setLastReply(reply)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply.answer,
          rooms: reply.suggestedRooms,
        },
      ])
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Chatbot dang ban, ban thu lai sau nhe.'
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: messageText },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitMessage()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-[24px] border border-[#E8E4DC] bg-white shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
        <div className="border-b border-[#E8E4DC] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1A1C1E]">Chatbot tu van phong</h2>
              <p className="mt-1 text-xs font-medium text-[#5C5348]">
                {lastReply?.usedAi ? 'Dang dung Cloudflare AI' : 'San sang ho tro dat phong'}
              </p>
            </div>
            <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#1B5E20]">
              Online
            </span>
          </div>
        </div>

        <div className="h-[520px] space-y-4 overflow-y-auto bg-[#FAF8F4] px-5 py-5">
          {messages.map((message) => (
            <article
              key={message.id}
              className={[
                'max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm',
                message.role === 'user'
                  ? 'ml-auto bg-[#FF7518] text-white'
                  : 'mr-auto border border-[#E8E4DC] bg-white text-[#1A1C1E]',
              ].join(' ')}
            >
              <p>{message.content}</p>
              {message.rooms && message.rooms.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {message.rooms.slice(0, 3).map((room) => (
                    <RoomSuggestion key={`${room.roomId ?? room.id ?? room.roomName}`} room={room} />
                  ))}
                </div>
              )}
            </article>
          ))}

          {isSending && (
            <div className="mr-auto inline-flex rounded-[20px] border border-[#E8E4DC] bg-white px-4 py-3 text-sm text-[#5C5348] shadow-sm">
              Dang suy nghi...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 border-t border-[#E8E4DC] bg-white p-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Hoi ve phong, gia, so nguoi hoac khung gio..."
            className="min-w-0 flex-1 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 text-sm text-[#1A1C1E] outline-none transition focus:border-[#FF7518] focus:bg-white"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="h-12 rounded-2xl bg-[#FF7518] px-5 font-display text-sm font-bold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:bg-[#D7D0C6]"
          >
            Gui
          </button>
        </form>
      </section>

      <aside className="rounded-[24px] border border-[#E8E4DC] bg-white p-5 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
        <h3 className="font-display text-base font-bold text-[#1A1C1E]">Cau hoi goi y</h3>
        <div className="mt-4 grid gap-2">
          {questions.slice(0, 8).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => void submitMessage(question)}
              disabled={isSending}
              className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3 text-left text-sm font-medium leading-5 text-[#5C5348] transition hover:border-[#FF7518] hover:bg-white hover:text-[#1A1C1E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {question}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

function RoomSuggestion({ room }: { room: ChatbotSuggestedRoom }) {
  const typeName = room.roomTypeName ?? room.roomType?.typeName ?? 'Phong tap'
  const price = room.pricePerHour ?? room.roomType?.pricePerHour
  const capacity = room.capacity ?? room.roomType?.capacity

  return (
    <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-xs text-[#5C5348]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-[#1A1C1E]">{room.roomName}</p>
          <p className="mt-1">{typeName}</p>
        </div>
        {room.status && (
          <span className="rounded-full bg-white px-2 py-1 font-bold text-[#1B5E20]">{room.status}</span>
        )}
      </div>
      <p className="mt-2">
        {formatPrice(price)}
        {capacity ? ` / toi da ${capacity} nguoi` : ''}
      </p>
      {room.reason && <p className="mt-1">{room.reason}</p>}
    </div>
  )
}

function formatPrice(price: number | string | null | undefined) {
  if (price === null || price === undefined || price === '') {
    return 'Chua co gia'
  }

  const numberPrice = Number(price)
  if (Number.isNaN(numberPrice)) {
    return String(price)
  }

  return `${numberPrice.toLocaleString('vi-VN')} VND/gio`
}
