import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react'
import { useAiStore } from '../../../store/aiStore'
import { streamChat } from '../../../api/aiService'

const AiChat = ({ agentId, systemPrompt, placeholder, colorClass = 'accent-green' }) => {
  const { chats, createChat, addMessage, updateLastMessage, deleteChat } = useAiStore()
  const [chatId, setChatId] = useState(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const existing = chats.find(c => c.agentId === agentId)
    if (existing) setChatId(existing.id)
    else setChatId(createChat(agentId))
  }, [agentId])

  const chat = chats.find(c => c.id === chatId)
  const messages = chat?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.content])

  const send = async () => {
    if (!input.trim() || streaming || !chatId) return
    const text = input.trim()
    setInput('')
    setStreaming(true)
    inputRef.current?.focus()

    addMessage(chatId, 'user', text)
    const assistantMsgId = addMessage(chatId, 'assistant', '')

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    let accumulated = ''
    await streamChat({
      messages: history,
      systemPrompt,
      onToken: (token) => {
        accumulated += token
        updateLastMessage(chatId, accumulated)
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        updateLastMessage(chatId, `❌ Xato: ${err}`)
        setStreaming(false)
      },
    })
  }

  const clearChat = () => {
    if (!chatId) return
    deleteChat(chatId)
    setChatId(createChat(agentId))
  }

  const colorMap = {
    'accent-green':  { btn: 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green', border: 'focus:border-accent-green', user: 'bg-accent-green/15' },
    'accent-blue':   { btn: 'bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue',   border: 'focus:border-accent-blue',  user: 'bg-accent-blue/15' },
    'accent-orange': { btn: 'bg-accent-orange/20 hover:bg-accent-orange/30 text-accent-orange', border: 'focus:border-accent-orange', user: 'bg-accent-orange/15' },
    'accent-red':    { btn: 'bg-accent-red/20 hover:bg-accent-red/30 text-accent-red',       border: 'focus:border-accent-red',   user: 'bg-accent-red/15' },
  }
  const c = colorMap[colorClass] || colorMap['accent-green']

  return (
    <div className="flex flex-col h-96 bg-bg-secondary rounded-xl border border-border overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">AI Agent</span>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted text-center py-10">
            Savol bering — AI agent javob beradi
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              m.role === 'user' ? `${c.user}` : 'bg-bg-tertiary border border-border'
            }`}>
              {m.role === 'user'
                ? <User size={10} className={`text-${colorClass}`} />
                : <Bot size={10} className="text-text-muted" />}
            </div>
            <div className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? `${c.user} text-text-primary`
                : 'bg-bg-primary border border-border text-text-primary'
            }`}>
              {m.content
                ? m.content
                : (streaming && m.role === 'assistant'
                    ? <span className="flex items-center gap-1 text-text-muted"><Loader2 size={11} className="animate-spin" /> Yozmoqda...</span>
                    : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="border-t border-border p-2 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={placeholder || 'Savol bering...'}
          disabled={streaming}
          className={`flex-1 text-xs bg-bg-primary border border-border rounded-lg px-3 py-2 focus:outline-none ${c.border} text-text-primary placeholder-text-muted transition-colors`}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className={`p-2 rounded-lg ${c.btn} disabled:opacity-40 transition-colors flex-shrink-0`}
        >
          {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

export default AiChat
