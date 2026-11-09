import { apiFetch } from './client'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantStatus {
  available: boolean
  message: string | null
}

interface AssistantReply {
  reply: string
}

export function getAssistantStatus(): Promise<AssistantStatus> {
  return apiFetch<AssistantStatus>('/assistant/status')
}

export async function sendAssistantMessage(
  messages: AssistantMessage[],
): Promise<string> {
  const response = await apiFetch<AssistantReply>('/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  return response.reply
}
