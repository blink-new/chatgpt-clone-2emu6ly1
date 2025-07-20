import React, { useState } from 'react'
import { Copy, RotateCcw, User, Bot } from 'lucide-react'
import { Button } from './ui/button'
import { Message } from '../types/chat'
import { cn } from '../lib/utils'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const TypingIndicator = () => (
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  )

  return (
    <div className={cn(
      'group flex gap-4 p-6 transition-colors',
      isUser ? 'bg-transparent' : 'bg-gray-50'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser 
          ? 'bg-gray-700 text-white' 
          : 'bg-primary text-primary-foreground'
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-sm mb-1">
              {isUser ? 'You' : 'ChatGPT'}
            </div>
            
            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Uploaded image ${index + 1}`}
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="prose prose-sm max-w-none">
              {message.isStreaming ? (
                <div className="flex items-center space-x-2">
                  <TypingIndicator />
                  <span className="text-gray-500 text-sm">Thinking...</span>
                </div>
              ) : isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <ReactMarkdown
                  components={{
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline ? (
                        <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-md font-medium mb-2">{children}</h3>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>

          {/* Actions */}
          {!message.isStreaming && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                title="Copy message"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              {!isUser && onRegenerate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRegenerate}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {copied && (
          <div className="text-xs text-green-600 mt-1">Copied!</div>
        )}
      </div>
    </div>
  )
}