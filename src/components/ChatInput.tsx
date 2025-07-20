import React, { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '../lib/utils'
import { ImageUpload } from '../types/chat'
import { blink } from '../blink/client'

interface ChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void
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
  const [images, setImages] = useState<ImageUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || images.length > 0) && !disabled && !isStreaming && !isUploading) {
      // Upload any pending images
      const imageUrls: string[] = []
      for (const img of images) {
        if (!img.uploaded && img.url) {
          imageUrls.push(img.url)
        } else if (img.uploaded && img.url) {
          imageUrls.push(img.url)
        }
      }

      onSendMessage(message.trim(), imageUrls.length > 0 ? imageUrls : undefined)
      setMessage('')
      setImages([])
      
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue
        }

        // Create preview
        const preview = URL.createObjectURL(file)
        
        // Upload to storage
        const { publicUrl } = await blink.storage.upload(
          file,
          `chat-images/${Date.now()}-${file.name}`,
          { upsert: true }
        )

        setImages(prev => [...prev, {
          file,
          preview,
          uploaded: true,
          url: publicUrl
        }])
      }
    } catch (error) {
      console.error('Failed to upload images:', error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const canSend = (message.trim() || images.length > 0) && !disabled && !isStreaming && !isUploading

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={img.preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                {!img.uploaded && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isUploading}
                className={cn(
                  'min-h-[44px] max-h-[200px] resize-none pr-20 py-3',
                  'border-gray-300 focus:border-primary focus:ring-primary',
                  'placeholder:text-gray-400'
                )}
                rows={1}
              />
              
              {/* Action Buttons */}
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                {/* Image Upload Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  {isUploading ? (
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                </Button>

                {/* Send/Stop Button */}
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-xs text-gray-500 text-center mt-2">
          ChatGPT can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  )
}