export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  isStreaming?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  isLoading: boolean
  isStreaming: boolean
}