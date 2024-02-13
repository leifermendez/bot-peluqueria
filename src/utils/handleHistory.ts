import { BotState } from "@bot-whatsapp/bot/dist/types"

export type History = { role: 'user' | 'assistant', content: string }

const handleHistory = async (inside: History, _state: BotState) => {
    const history = _state.get<History[]>('history') ?? []
    history.push(inside)
    await _state.update({ history })
}

const getHistory = (_state: BotState, k = 6) => {
    const history = _state.get<History[]>('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory
}

const getHistoryParse = (_state: BotState, k = 6): string => {
    const history = _state.get<History[]>('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory.reduce((prev, current) => {
        const msg = current.role === 'user' ? `\nCliente: "${current.content}"` : `\nVendedor: "${current.content}"`
        prev += msg
        return prev
    }, ``)
}

const clearHistory = async (_state: BotState) => {
    _state.clear()
}


export { handleHistory, getHistory, getHistoryParse, clearHistory }