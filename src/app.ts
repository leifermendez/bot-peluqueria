import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'

import AIClass from './services/ai';
import flow from './flows';
import { getInitSettings } from './make';

const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo-16k')
const PORT = process.env.PORT ?? 3001

const main = async () => {
    const prompts = await getInitSettings()
    const provider = createProvider(BaileysProvider)

    await createBot({
        database: new MemoryDB(),
        provider,
        flow,
    }, { extensions: { ai, prompts } })


    provider.initHttpServer(+PORT)
    console.log(`[Escanear QR] http://localhost:3000`)

}

main()