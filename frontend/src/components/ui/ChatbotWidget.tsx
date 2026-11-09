import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getAssistantStatus,
  sendAssistantMessage,
  type AssistantMessage,
} from '../../api/assistant'
import './ChatbotWidget.css'

interface DisplayMessage extends AssistantMessage {
  id: number
}

type ConnectionState = 'checking' | 'online' | 'offline'

const WELCOME_MESSAGE: DisplayMessage = {
  id: 0,
  role: 'assistant',
  content:
    "Hi, I'm E.D.I.T.H. AI Assistant. Ask me about digital identity, cybersecurity awareness, or how to use this platform.",
}

function AssistantMark({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2.8 13.9 9l6.3 2-6.3 2-1.9 6.2L10.1 13l-6.3-2 6.3-2L12 2.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="m3 9 14-6-5.8 14-2.1-6-6.1-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="m9.1 11 4.1-4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function LoadingIndicator() {
  return (
    <div
      aria-label="E.D.I.T.H. AI Assistant is typing"
      className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-raised px-3 py-3"
      role="status"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="assistant-typing-dot h-1.5 w-1.5 rounded-full bg-accent"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'The assistant could not respond. Please try again in a moment.'
}

function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 429
  )
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>('checking')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const nextId = useRef(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const checkConnection = useCallback(async () => {
    try {
      const status = await getAssistantStatus()
      setConnection(status.available ? 'online' : 'offline')
      setConnectionMessage(status.message ?? '')
    } catch (error) {
      setConnection('offline')
      setConnectionMessage(errorMessage(error))
    }
  }, [])

  useEffect(() => {
    if (isOpen && connection === 'checking') {
      void checkConnection()
    }
  }, [checkConnection, connection, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || isSending || connection !== 'online') {
      return
    }

    const userMessage: DisplayMessage = {
      id: nextId.current++,
      role: 'user',
      content,
    }
    const conversation = [...messages.filter((message) => message.id !== 0), userMessage]
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setSendError('')
    setIsSending(true)

    try {
      const reply = await sendAssistantMessage(
        conversation.slice(-16).map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        })),
      )
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: reply },
      ])
    } catch (error) {
      setSendError(errorMessage(error))
      if (!isRateLimitError(error)) {
        setConnection('offline')
        setConnectionMessage(errorMessage(error))
      }
    } finally {
      setIsSending(false)
    }
  }

  const clearConversation = () => {
    setMessages([WELCOME_MESSAGE])
    setSendError('')
    setDraft('')
    nextId.current = 1
  }

  if (!isOpen) {
    return (
      <button
        aria-label="Open E.D.I.T.H. AI Assistant"
        className="assistant-launcher assistant-orb fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-raised text-accent shadow-[0_0_28px_rgba(92,200,184,0.22)] transition duration-200 hover:scale-105 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent xl:bottom-6 xl:right-6"
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        type="button"
      >
        <span className="assistant-orb-halo absolute inset-0 rounded-full border border-accent/40" />
        <AssistantMark className="relative h-7 w-7" />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <section
        aria-label="Minimized E.D.I.T.H. AI Assistant"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-panel xl:bottom-6 xl:right-6"
      >
        <span
          aria-label={connection === 'online' ? 'Online' : 'Offline'}
          className={`h-2 w-2 rounded-full ${connection === 'online' ? 'bg-trusted' : 'bg-muted'}`}
        />
        <button
          className="text-sm font-medium text-ink hover:text-accent"
          onClick={() => setIsMinimized(false)}
          type="button"
        >
          E.D.I.T.H. AI Assistant
        </button>
        <button
          aria-label="Close E.D.I.T.H. AI Assistant"
          className="rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink"
          onClick={() => setIsOpen(false)}
          type="button"
        >
          <CloseIcon />
        </button>
      </section>
    )
  }

  return (
    <section
      aria-label="E.D.I.T.H. AI Assistant"
      className="assistant-window fixed bottom-20 right-3 z-40 flex w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-panel xl:bottom-6 xl:right-6"
      role="dialog"
      style={{
        height: 'min(640px, calc(100dvh - 7rem - env(safe-area-inset-bottom)))',
      }}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-raised/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <AssistantMark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">
              E.D.I.T.H. AI Assistant
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  connection === 'online'
                    ? 'bg-trusted'
                    : connection === 'checking'
                      ? 'animate-pulse bg-watch'
                      : 'bg-muted'
                }`}
              />
              <span className="text-[11px] text-muted">
                {connection === 'online'
                  ? 'Online'
                  : connection === 'checking'
                    ? 'Connecting'
                    : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <button
            aria-label="Minimize E.D.I.T.H. AI Assistant"
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setIsMinimized(true)}
            type="button"
          >
            <MinimizeIcon />
          </button>
          <button
            aria-label="Close E.D.I.T.H. AI Assistant"
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-line/70 px-4 py-2">
        <p className="text-[11px] text-muted">Cybersecurity, made clearer.</p>
        <button
          className="rounded-md px-2 py-1 text-[11px] text-muted transition hover:bg-raised hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          disabled={messages.length === 1 && !sendError && !draft}
          onClick={clearConversation}
          type="button"
        >
          Clear conversation
        </button>
      </div>

      <div
        aria-busy={isSending}
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        role="log"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <AssistantMark className="h-4 w-4" />
              </div>
            )}
            <p
              className={`max-w-[84%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                message.role === 'user'
                  ? 'rounded-br-md bg-accent text-canvas'
                  : 'rounded-bl-md border border-line bg-raised text-ink'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isSending && (
          <div className="flex items-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <AssistantMark className="h-4 w-4" />
            </div>
            <LoadingIndicator />
          </div>
        )}
        {sendError && (
          <p
            className="rounded-xl border border-suspicious/30 bg-suspicious/10 px-3 py-2 text-xs leading-relaxed text-ink"
            role="alert"
          >
            {sendError}
          </p>
        )}
        {connection === 'offline' && (
          <div className="rounded-xl border border-line bg-raised/70 px-3 py-3 text-xs leading-relaxed text-muted">
            <p>{connectionMessage || 'The AI service is currently unavailable.'}</p>
            <button
              className="mt-2 font-medium text-accent hover:underline"
              onClick={() => {
                setConnection('checking')
                setConnectionMessage('')
              }}
              type="button"
            >
              Check connection again
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="shrink-0 border-t border-line bg-canvas/40 p-3"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSend()
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-line bg-canvas p-2 transition focus-within:border-accent/60">
          <textarea
            aria-label="Message E.D.I.T.H. AI Assistant"
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm text-ink outline-none placeholder:text-muted/70 disabled:cursor-not-allowed"
            disabled={connection !== 'online' || isSending}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
            placeholder={
              connection === 'online'
                ? 'Ask about identity, privacy, or E.D.I.T.H...'
                : 'Assistant is unavailable'
            }
            rows={1}
            value={draft}
          />
          <button
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-canvas transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!draft.trim() || connection !== 'online' || isSending}
            type="submit"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted/80">
          AI responses may be imperfect. Do not share sensitive information.
        </p>
      </form>
    </section>
  )
}
