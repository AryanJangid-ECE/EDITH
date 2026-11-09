import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssistantStatus, sendAssistantMessage } from '../../api/assistant'
import { ChatbotWidget } from './ChatbotWidget'

vi.mock('../../api/assistant', () => ({
  getAssistantStatus: vi.fn(),
  sendAssistantMessage: vi.fn(),
}))

const mockedGetStatus = vi.mocked(getAssistantStatus)
const mockedSendMessage = vi.mocked(sendAssistantMessage)

describe('ChatbotWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetStatus.mockResolvedValue({ available: true, message: null })
    mockedSendMessage.mockResolvedValue('A digital identity represents you online.')
  })

  it('opens, minimizes, closes, and preserves the conversation', async () => {
    const user = userEvent.setup()
    render(<ChatbotWidget />)

    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))
    expect(await screen.findByRole('dialog', { name: /e\.d\.i\.t\.h\. ai assistant/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /minimize e\.d\.i\.t\.h\. ai assistant/i }))
    expect(screen.getByRole('region', { name: /minimized e\.d\.i\.t\.h\. ai assistant/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /e\.d\.i\.t\.h\. ai assistant/i }))
    await user.click(screen.getByRole('button', { name: /close e\.d\.i\.t\.h\. ai assistant/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))

    expect(await screen.findByText(/ask me about digital identity/i)).toBeInTheDocument()
  })

  it('sends the conversation, shows typing feedback, and renders the AI reply', async () => {
    const user = userEvent.setup()
    let finishReply: (reply: string) => void = () => undefined
    mockedSendMessage.mockReturnValue(
      new Promise((resolve) => {
        finishReply = resolve
      }),
    )
    render(<ChatbotWidget />)

    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))
    const input = await screen.findByRole('textbox', { name: /message e\.d\.i\.t\.h\. ai assistant/i })
    await user.type(input, 'What is digital identity?')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(mockedSendMessage).toHaveBeenCalledWith([
      { role: 'user', content: 'What is digital identity?' },
    ])
    expect(screen.getByRole('status', { name: /assistant is typing/i })).toBeInTheDocument()
    await act(async () => finishReply('A digital identity represents you online.'))
    expect(await screen.findByText(/represents you online/i)).toBeInTheDocument()
  })

  it('shows an offline state and retries the status check', async () => {
    const user = userEvent.setup()
    mockedGetStatus
      .mockResolvedValueOnce({ available: false, message: 'Configure the backend AI service.' })
      .mockResolvedValueOnce({ available: true, message: null })
    render(<ChatbotWidget />)

    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))
    expect(await screen.findByText(/configure the backend ai service/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /message e\.d\.i\.t\.h\. ai assistant/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /check connection again/i }))
    await waitFor(() => expect(screen.getByText('Online')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: /message e\.d\.i\.t\.h\. ai assistant/i })).toBeEnabled()
  })

  it('displays provider errors and lets the user retry service status', async () => {
    const user = userEvent.setup()
    mockedSendMessage.mockRejectedValueOnce(new Error('The AI service is temporarily unavailable.'))
    render(<ChatbotWidget />)

    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))
    const input = await screen.findByRole('textbox', { name: /message e\.d\.i\.t\.h\. ai assistant/i })
    await user.type(input, 'How can I protect my account?')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i)
    expect(screen.getByRole('button', { name: /check connection again/i })).toBeInTheDocument()
    expect(mockedGetStatus).toHaveBeenCalledTimes(1)
  })

  it('clears chat history without calling the AI', async () => {
    const user = userEvent.setup()
    render(<ChatbotWidget />)

    await user.click(screen.getByRole('button', { name: /open e\.d\.i\.t\.h\. ai assistant/i }))
    const input = await screen.findByRole('textbox', { name: /message e\.d\.i\.t\.h\. ai assistant/i })
    await user.type(input, 'Explain multifactor authentication')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(await screen.findByText(/represents you online/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear conversation/i }))

    expect(screen.queryByText(/represents you online/i)).not.toBeInTheDocument()
    expect(screen.getByText(/ask me about digital identity/i)).toBeInTheDocument()
  })
})
