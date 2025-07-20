import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Chat, Message, ChatState } from '../types/chat'

interface ChatContextType {
  state: ChatState
  createNewChat: () => string
  selectChat: (chatId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (messageId: string, content: string) => void
  deleteChat: (chatId: string) => void
  setStreaming: (isStreaming: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

type ChatAction =
  | { type: 'CREATE_CHAT'; payload: Chat }
  | { type: 'SELECT_CHAT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; content: string } }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'LOAD_CHATS'; payload: Chat[] }

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'CREATE_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        currentChatId: action.payload.id
      }
    
    case 'SELECT_CHAT':
      return {
        ...state,
        currentChatId: action.payload
      }
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === state.currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, action.payload],
                updatedAt: Date.now()
              }
            : chat
        )
      }
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === state.currentChatId
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === action.payload.messageId
                    ? { ...msg, content: action.payload.content, isStreaming: false }
                    : msg
                ),
                updatedAt: Date.now()
              }
            : chat
        )
      }
    
    case 'DELETE_CHAT': {
      const remainingChats = state.chats.filter(chat => chat.id !== action.payload)
      return {
        ...state,
        chats: remainingChats,
        currentChatId: state.currentChatId === action.payload 
          ? (remainingChats.length > 0 ? remainingChats[0].id : null)
          : state.currentChatId
      }
    }
    
    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload
      }
    
    case 'LOAD_CHATS':
      return {
        ...state,
        chats: action.payload,
        isLoading: false
      }
    
    default:
      return state
  }
}

const generateChatTitle = (firstMessage: string): string => {
  const words = firstMessage.split(' ').slice(0, 6)
  return words.join(' ') + (firstMessage.split(' ').length > 6 ? '...' : '')
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, {
    chats: [],
    currentChatId: null,
    isLoading: true,
    isStreaming: false
  })

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chatgpt-clone-chats')
    if (savedChats) {
      try {
        const chats = JSON.parse(savedChats)
        dispatch({ type: 'LOAD_CHATS', payload: chats })
      } catch (error) {
        console.error('Failed to load chats:', error)
        dispatch({ type: 'LOAD_CHATS', payload: [] })
      }
    } else {
      dispatch({ type: 'LOAD_CHATS', payload: [] })
    }
  }, [])

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('chatgpt-clone-chats', JSON.stringify(state.chats))
    }
  }, [state.chats, state.isLoading])

  const createNewChat = (): string => {
    const newChat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    dispatch({ type: 'CREATE_CHAT', payload: newChat })
    return newChat.id
  }

  const selectChat = (chatId: string) => {
    dispatch({ type: 'SELECT_CHAT', payload: chatId })
  }

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
    
    // Update chat title if this is the first user message
    if (message.role === 'user') {
      const currentChat = state.chats.find(chat => chat.id === state.currentChatId)
      if (currentChat && currentChat.messages.length === 0) {
        const title = generateChatTitle(message.content)
        const updatedChats = state.chats.map(chat =>
          chat.id === state.currentChatId ? { ...chat, title } : chat
        )
        dispatch({ type: 'LOAD_CHATS', payload: updatedChats })
      }
    }
    
    return newMessage.id
  }

  const updateMessage = (messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { messageId, content } })
  }

  const deleteChat = (chatId: string) => {
    dispatch({ type: 'DELETE_CHAT', payload: chatId })
  }

  const setStreaming = (isStreaming: boolean) => {
    dispatch({ type: 'SET_STREAMING', payload: isStreaming })
  }

  return (
    <ChatContext.Provider value={{
      state,
      createNewChat,
      selectChat,
      addMessage,
      updateMessage,
      deleteChat,
      setStreaming
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export { ChatContext }