export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  isStreaming?: boolean
  images?: string[] // Array of image URLs
}

export interface ImageUpload {
  file: File
  preview: string
  uploaded?: boolean
  url?: string
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