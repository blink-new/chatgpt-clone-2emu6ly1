import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChat } from '../hooks/useChat'
import { blink } from '../blink/client'
import { cn } from '../lib/utils'

export const ChatInterface: React.FC = () => {
  const { state, createNewChat, addMessage, updateMessage, setStreaming } = useChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const currentChat = state.chats.find(chat => chat.id === state.currentChatId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages])

  // Create initial chat if none exists
  useEffect(() => {
    if (!state.isLoading && state.chats.length === 0) {
      createNewChat()
    }
  }, [state.isLoading, state.chats.length, createNewChat])

  const handleSendMessage = async (content: string) => {
    if (!state.currentChatId) {
      const newChatId = createNewChat()
      // Wait a bit for the chat to be created
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Add user message
    addMessage({
      content,
      role: 'user'
    })

    // Add streaming assistant message
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
      isStreaming: true
    })

    setCurrentStreamingMessageId(assistantMessageId)
    setStreaming(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      let streamedContent = ''
      
      await blink.ai.streamText(
        {
          prompt: content,
          model: 'gpt-4o-mini',
          maxTokens: 2000
        },
        (chunk) => {
          streamedContent += chunk
          updateMessage(assistantMessageId, streamedContent)
        }
      )

      // Mark streaming as complete
      updateMessage(assistantMessageId, streamedContent)
    } catch (error) {
      console.error('Error generating response:', error)
      updateMessage(assistantMessageId, 'Sorry, I encountered an error while generating a response. Please try again.')
    } finally {
      setStreaming(false)
      setCurrentStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setStreaming(false)
      setCurrentStreamingMessageId(null)
      
      // Update the streaming message to indicate it was stopped
      if (currentStreamingMessageId) {
        updateMessage(currentStreamingMessageId, 'Response generation was stopped.')
      }
    }
  }

  const handleRegenerate = async () => {
    if (!currentChat || currentChat.messages.length < 2) return

    const lastUserMessage = [...currentChat.messages]
      .reverse()
      .find(msg => msg.role === 'user')

    if (lastUserMessage) {
      await handleSendMessage(lastUserMessage.content)
    }
  }

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          How can I help you today?
        </h2>
        <p className="text-gray-600 mb-6">
          Start a conversation by typing a message below. I can help with questions, creative writing, analysis, coding, and much more.
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg text-left">
            <div className="font-medium text-gray-900">💡 Example prompts:</div>
            <div className="text-gray-600 mt-1">
              "Explain quantum computing in simple terms"
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-left">
            <div className="text-gray-600">
              "Write a creative story about a time traveler"
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-left">
            <div className="text-gray-600">
              "Help me debug this JavaScript code"
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <ChatSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentChat?.title || 'ChatGPT 4.0 Clone'}
            </h1>
          </div>
          
          <div className="text-sm text-gray-500">
            GPT-4o Mini
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          {!currentChat || currentChat.messages.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="flex-1 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                {currentChat.messages.map((message) => (
                  <div key={message.id} className="message-enter">
                    <ChatMessage
                      message={message}
                      onRegenerate={message.role === 'assistant' ? handleRegenerate : undefined}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={state.isLoading}
            isStreaming={state.isStreaming}
            onStopStreaming={handleStopStreaming}
          />
        </div>
      </div>
    </div>
  )
}