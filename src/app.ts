import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { TelegramProvider } from '@builderbot-plugins/telegram'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'

import AIClass from './services/ai';
import flows from './flows';

const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo-16k')

const main = async () => {

    const provider = createProvider(BaileysProvider)
    // const provider = createProvider(TelegramProvider, { token: process.env.TELEGRAM_API ?? '' })

    await createBot({
        database: new MemoryDB(),
        provider,
        flow: flows
    }, { extensions: { ai } })

}

main()