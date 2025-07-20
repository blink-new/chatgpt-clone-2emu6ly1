import React from 'react'
import { Plus, MessageSquare, Trash2, Edit3 } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useChat } from '../hooks/useChat'
import { cn } from '../lib/utils'

interface ChatSidebarProps {
  className?: string
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ className }) => {
  const { state, createNewChat, selectChat, deleteChat } = useChat()

  const handleNewChat = () => {
    createNewChat()
  }

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId)
  }

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-900 text-white', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <Button
          onClick={handleNewChat}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {state.chats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs">Start a new conversation</p>
            </div>
          ) : (
            state.chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={cn(
                  'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-800',
                  state.currentChatId === chat.id
                    ? 'bg-gray-800 border border-gray-600'
                    : 'border border-transparent'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm truncate">{chat.title}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {chat.messages.length} messages
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          ChatGPT 4.0 Clone
        </div>
      </div>
    </div>
  )
}