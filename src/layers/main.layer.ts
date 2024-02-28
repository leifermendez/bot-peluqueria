import { BotContext, BotMethods } from "@bot-whatsapp/bot/dist/types"
import { getHistoryParse } from "../utils/handleHistory"
import AIClass from "../services/ai"
import { flowSeller } from "../flows/seller.flow"
import { flowSchedule } from "../flows/schedule.flow"
import { flowConfirm } from "../flows/confirm.flow"

/**
 * Determina que flujo va a iniciarse basado en el historial que previo entre el bot y el humano
 */
export default async (_: BotContext, { state, gotoFlow, extensions }: BotMethods) => {
    const ai = extensions.ai as AIClass
    const prompts = extensions.prompts
    const history = getHistoryParse(state)
    const prompt = prompts.descriminador

    console.log(prompt.replace('{HISTORY}', history))

    const text = await ai.createChat([
        {
            role: 'system',
            content: prompt.replace('{HISTORY}', history)
        }
    ])


    console.log(`*****`, text)

    if (text.includes('HABLAR')) return gotoFlow(flowSeller)
    if (text.includes('AGENDAR')) return gotoFlow(flowSchedule)
    if (text.includes('CONFIRMAR')) return gotoFlow(flowConfirm)
}