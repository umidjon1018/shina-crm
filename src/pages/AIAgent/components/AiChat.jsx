import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react'
import { useAiStore } from '../../../store/aiStore'
import { streamChat } from '../../../api/aiService'

const renderMarkdown = (text) => {
  const lines = text.split('\n')
  const result = []
  let tableRows = []

  const flushTable = () => {
    if (tableRows.length < 2) { tableRows.forEach((r, i) => result.push(<p key={`md-tp${i}`} className="text-xs">{r}</p>)); tableRows = []; return }
    const headers = tableRows[0].split('|').map(h => h.trim()).filter(Boolean)
    const rows = tableRows.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean))
    result.push(
      <div key={`md-tbl${result.length}`} className="overflow-x-auto my-1">
        <table className="text-xs border-collapse w-full">
          <thead><tr>{headers.map((h,i) => <th key={i} className="border border-border px-2 py-1 text-left font-semibold bg-bg-tertiary">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r,i) => <tr key={i}>{r.map((c,j) => <td key={j} className="border border-border px-2 py-1">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
    tableRows = []
  }

  lines.forEach((line, i) => {
    if (line.trim().startsWith('|')) { tableRows.push(line); return }
    if (tableRows.length) flushTable()

    if (/^###\s/.test(line)) {
      result.push(<p key={`md-${i}`} className="font-bold text-xs mt-2">{line.replace(/^###\s/, '')}</p>)
    } else if (/^##\s/.test(line)) {
      result.push(<p key={`md-${i}`} className="font-bold text-sm mt-2">{line.replace(/^##\s/, '')}</p>)
    } else if (/^#\s/.test(line)) {
      result.push(<p key={`md-${i}`} className="font-bold text-sm mt-2">{line.replace(/^#\s/, '')}</p>)
    } else if (/^[-*]\s/.test(line)) {
      const inner = line.replace(/^[-*]\s/, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      result.push(<div key={`md-${i}`} className="flex gap-1.5 text-xs"><span className="mt-0.5 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: inner }} /></div>)
    } else if (line.trim() === '') {
      result.push(<div key={`md-${i}`} className="h-1" />)
    } else {
      const inner = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code class="bg-bg-tertiary px-1 rounded text-[10px]">$1</code>')
      result.push(<p key={`md-${i}`} className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: inner }} />)
    }
  })
  if (tableRows.length) flushTable()
  return result
}

// chatKey — suhbat tarixi kaliti (bitta agent turli bo'limlarda alohida suhbat); section — backendga bo'lim konteksti
const AiChat = ({ agentId, chatKey, section, systemPrompt, placeholder, colorClass = 'accent-green', autoPrompt, suggestions, heightClass = 'h-[600px]' }) => {
  const historyKey = chatKey || agentId
  const { chats, createChat, addMessage, updateLastMessage, deleteChat } = useAiStore()
  const [chatId, setChatId] = useState(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeModel, setActiveModel] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const streamingRef = useRef(false)
  const autoSentRef = useRef(false)

  useEffect(() => {
    const existing = chats.find(c => c.agentId === historyKey)
    if (existing) setChatId(existing.id)
    else setChatId(createChat(historyKey))
    autoSentRef.current = false
  }, [historyKey])

  const chat = chats.find(c => c.id === chatId)
  const messages = chat?.messages || []

  // Faqat streaming paytida scroll — tab switch da scroll bo'lmasin
  useEffect(() => {
    if (streamingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages[messages.length - 1]?.content])

  const sendText = async (text, silent = false) => {
    if (!text.trim() || streaming || !chatId) return
    streamingRef.current = true
    setStreaming(true)
    if (!silent) inputRef.current?.focus()

    addMessage(chatId, 'user', text)
    const assistantMsgId = addMessage(chatId, 'assistant', '')

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    let accumulated = ''
    await streamChat({
      messages: history,
      agentId,
      systemPrompt,
      section,
      onModel: (m) => setActiveModel(m),
      onToken: (token) => {
        accumulated += token
        updateLastMessage(chatId, accumulated)
      },
      onDone: () => { setStreaming(false); streamingRef.current = false },
      onError: (err) => {
        updateLastMessage(chatId, `❌ Xato: ${err}`)
        setStreaming(false)
        streamingRef.current = false
      },
    })
  }

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    await sendText(text)
  }

  // autoPrompt: tab birinchi ochilganda, chat bo'sh bo'lsa avtomatik yuborish
  useEffect(() => {
    if (!autoPrompt || !chatId || autoSentRef.current) return
    const chat = chats.find(c => c.id === chatId)
    if (!chat || chat.messages.length > 0) return
    autoSentRef.current = true
    sendText(autoPrompt, true)
  }, [chatId])

  const clearChat = () => {
    if (!chatId) return
    deleteChat(chatId)
    setChatId(createChat(historyKey))
  }

  const colorMap = {
    'accent-green':  { btn: 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green', border: 'focus:border-accent-green', user: 'bg-accent-green/15' },
    'accent-blue':   { btn: 'bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue',   border: 'focus:border-accent-blue',  user: 'bg-accent-blue/15' },
    'accent-orange': { btn: 'bg-accent-orange/20 hover:bg-accent-orange/30 text-accent-orange', border: 'focus:border-accent-orange', user: 'bg-accent-orange/15' },
    'accent-red':    { btn: 'bg-accent-red/20 hover:bg-accent-red/30 text-accent-red',       border: 'focus:border-accent-red',   user: 'bg-accent-red/15' },
    'accent-purple': { btn: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400',      border: 'focus:border-purple-400',   user: 'bg-purple-500/15' },
    'accent-pink':   { btn: 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400',            border: 'focus:border-pink-400',     user: 'bg-pink-500/15' },
  }
  const c = colorMap[colorClass] || colorMap['accent-green']

  return (
    <div className={`flex flex-col ${heightClass} bg-bg-secondary rounded-xl border border-border overflow-hidden`}>
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">AI Agent</span>
          {activeModel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-muted border border-border font-mono">
              {activeModel.replace(/-\d{8,}.*$/, '').replace('claude-', '')}
            </span>
          )}
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
        {messages.length === 0 && suggestions?.length > 0 && (
          // suggestions: ['savol', ...] yoki guruhlangan [{ group, items: ['savol', ...] }]
          <div className="space-y-3">
            {(suggestions[0]?.items ? suggestions : [{ group: null, items: suggestions }]).map((g, gi) => (
              <div key={gi} className="space-y-1.5">
                {g.group && <p className="text-[11px] font-semibold text-text-muted text-center">{g.group}</p>}
                <div className="flex flex-wrap justify-center gap-2">
                  {g.items.map(q => (
                    <button key={q} onClick={() => sendText(q)} disabled={streaming}
                      className={`text-xs px-3 py-1.5 rounded-full border border-border ${c.user} text-text-primary hover:opacity-80 disabled:opacity-40`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
            <div className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              m.role === 'user'
                ? `${c.user} text-text-primary`
                : 'bg-bg-primary border border-border text-text-primary'
            }`}>
              {m.content
                ? (m.role === 'assistant' ? <div className="space-y-0.5">{renderMarkdown(m.content)}</div> : m.content)
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
