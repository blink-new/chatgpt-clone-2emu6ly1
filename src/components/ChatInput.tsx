import React, { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '../lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isStreaming = false,
  onStopStreaming,
  placeholder = "Message ChatGPT..."
}) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isStreaming) {
      onSendMessage(message.trim())
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const canSend = message.trim() && !disabled && !isStreaming

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  'min-h-[44px] max-h-[200px] resize-none pr-12 py-3',
                  'border-gray-300 focus:border-primary focus:ring-primary',
                  'placeholder:text-gray-400'
                )}
                rows={1}
              />
              
              {/* Send/Stop Button */}
              <div className="absolute right-2 bottom-2">
                {isStreaming ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStop}
                    className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canSend}
                    className={cn(
                      'h-8 w-8 p-0',
                      canSend
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          ChatGPT can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  )
}