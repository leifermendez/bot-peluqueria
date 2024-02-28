import 'dotenv/config';
import { addKeyword, EVENTS, createFlow, createProvider, createBot, MemoryDB } from '@bot-whatsapp/bot';
import { BaileysProvider } from '@bot-whatsapp/provider-baileys';
import OpenAI from 'openai';
import { format, addMinutes } from 'date-fns';

class AIClass {
    openai;
    model;
    constructor(apiKey, _model) {
        this.openai = new OpenAI({ apiKey, timeout: 15 * 1000 });
        if (!apiKey || apiKey.length === 0) {
            throw new Error("OPENAI_KEY is missing");
        }
        this.model = _model;
    }
    createChat = async (messages, model, temperature = 0) => {
        try {
            const completion = await this.openai.chat.completions.create({
                model: model ?? this.model,
                messages,
                temperature,
                max_tokens: 326,
                top_p: 0,
                frequency_penalty: 0,
                presence_penalty: 0,
            });
            return completion.choices[0].message.content;
        }
        catch (err) {
            console.error(err);
            return "ERROR";
        }
    };
}

const handleHistory = async (inside, _state) => {
    const history = _state.get('history') ?? [];
    history.push(inside);
    await _state.update({ history });
};
const getHistoryParse = (_state, k = 6) => {
    const history = _state.get('history') ?? [];
    const limitHistory = history.slice(-k);
    return limitHistory.reduce((prev, current) => {
        const msg = current.role === 'user' ? `\nCliente: "${current.content}"` : `\nVendedor: "${current.content}"`;
        prev += msg;
        return prev;
    }, ``);
};
const clearHistory = async (_state) => {
    _state.clear();
};

var conversationalLayer = async ({ body }, { state, }) => {
    await handleHistory({ content: body, role: 'user' }, state);
};

function generateTimer(min, max) {
    const numSal = Math.random();
    const numeroAleatorio = Math.floor(numSal * (max - min + 1)) + min;
    return numeroAleatorio;
}

const getFullCurrentDate = () => {
    const currentD = new Date();
    const formatDate = format(currentD, 'yyyy/MM/dd HH:mm');
    const day = format(currentD, 'EEEE');
    return [
        formatDate,
        day,
    ].join(' ');
};

const generatePromptSeller = (history, prompt) => {
    const nowDate = getFullCurrentDate();
    return prompt.replace('{HISTORY}', history).replace('{CURRENT_DAY}', nowDate);
};
const flowSeller = addKeyword(EVENTS.ACTION).addAction(async (_, { state, flowDynamic, extensions, globalState }) => {
    try {
        const ai = extensions.ai;
        const prompts = extensions.prompts;
        const history = getHistoryParse(state);
        const prompt = generatePromptSeller(history, prompts.hablar);
        console.log(`---------------------promtp hablar --------------------------`);
        console.log(prompt);
        const text = await ai.createChat([
            {
                role: 'system',
                content: prompt
            }
        ]);
        await handleHistory({ content: text, role: 'assistant' }, state);
        const chunks = text.split(/(?<!\d)\.\s+/g);
        for (const chunk of chunks) {
            await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
        }
    }
    catch (err) {
        console.log(`[ERROR]:`, err);
        return;
    }
});

const MAKE_GET_PROMPTS_TEMPLATE = 'https://hook.eu2.make.com/s4vbwccdaehroz2ba4m4beo0tuhpvl7u';
const MAKE_ADD_TO_CALENDAR = 'https://hook.eu2.make.com/47p87mq25c0qc51gc8g5l6d9mlqo96sq';
const MAKE_GET_FROM_CALENDAR = 'https://hook.eu2.make.com/07e1u19yalhj7nj3bt6oojvwghkeryh1';

const getCurrentCalendar = async () => {
    const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR);
    const json = await dataCalendarApi.json();
    const list = json.reduce((prev, current) => {
        if (!current.fecha)
            return prev;
        return prev += [
            `Espacio reservado (no disponible): `,
            `Desde ${format(current.fecha, 'eeee do h:mm a')} `,
            `Hasta ${format(addMinutes(current.fecha, 45), 'eeee do h:mm a')} \n`,
        ].join(' ');
    }, '');
    return list;
};
const appToCalendar = async (text) => {
    try {
        const payload = JSON.parse(text);
        console.log(payload);
        const dataApi = await fetch(MAKE_ADD_TO_CALENDAR, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });
        return dataApi;
    }
    catch (err) {
        console.log(`error: `, err);
    }
};

const generateSchedulePrompt = (summary, history, prompt) => {
    const nowDate = getFullCurrentDate();
    const mainPrompt = prompt
        .replace('{AGENDA_ACTUAL}', summary)
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate);
    return mainPrompt;
};
const flowSchedule = addKeyword(EVENTS.ACTION).addAction(async (ctx, { extensions, state, flowDynamic }) => {
    await flowDynamic('dame un momento para consultar la agenda...');
    const ai = extensions.ai;
    const prompts = extensions.prompts;
    const history = getHistoryParse(state);
    const list = await getCurrentCalendar();
    const promptSchedule = generateSchedulePrompt(list?.length ? list : 'ninguna', history, prompts.agendar);
    const text = await ai.createChat([
        {
            role: 'system',
            content: promptSchedule
        },
        {
            role: 'user',
            content: `Cliente pregunta: ${ctx.body}`
        }
    ], 'gpt-4');
    await handleHistory({ content: text, role: 'assistant' }, state);
    const chunks = text.split(/(?<!\d)\.\s+/g);
    for (const chunk of chunks) {
        await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
    }
});

const generatePromptToFormatDate = (history) => {
    const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    Fecha ideal:...dd / mm hh:mm`;
    return prompt;
};
const generateJsonParse = (info) => {
    const prompt = `tu tarea principal es analizar la información proporcionada en el contexto y generar un objeto JSON que se adhiera a la estructura especificada a continuación. 

    Contexto: "${info}"
    
    {
        "name": "Leifer",
        "interest": "n/a",
        "value": "0",
        "email": "fef@fef.com",
        "startDate": "2024/02/15 00:00:00"
    }
    
    Objeto JSON a generar:`;
    return prompt;
};
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Ok, voy a pedirte unos datos para agendar');
    await flowDynamic('¿Cual es tu nombre?');
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, extensions }) => {
    await state.update({ name: ctx.body });
    const ai = extensions.ai;
    const history = getHistoryParse(state);
    const text = await ai.createChat([
        {
            role: 'system',
            content: generatePromptToFormatDate(history)
        }
    ], 'gpt-4');
    await handleHistory({ content: text, role: 'assistant' }, state);
    await flowDynamic(`¿Me confirmas fecha y hora?: ${text}`);
    await state.update({ startDate: text });
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    await flowDynamic(`Ultima pregunta ¿Cual es tu email?`);
})
    .addAction({ capture: true }, async (ctx, { state, extensions, flowDynamic }) => {
    const infoCustomer = `Name: ${state.get('name')}, StarteDate: ${state.get('startDate')}, email: ${ctx.body}`;
    const ai = extensions.ai;
    const text = await ai.createChat([
        {
            role: 'system',
            content: generateJsonParse(infoCustomer)
        }
    ]);
    await appToCalendar(text);
    clearHistory(state);
    await flowDynamic('Listo! agendado Buen dia');
});

var mainLayer = async (_, { state, gotoFlow, extensions }) => {
    const ai = extensions.ai;
    const prompts = extensions.prompts;
    const history = getHistoryParse(state);
    const prompt = prompts.descriminador;
    console.log(prompt.replace('{HISTORY}', history));
    const text = await ai.createChat([
        {
            role: 'system',
            content: prompt.replace('{HISTORY}', history)
        }
    ]);
    console.log(`*****`, text);
    if (text.includes('HABLAR'))
        return gotoFlow(flowSeller);
    if (text.includes('AGENDAR'))
        return gotoFlow(flowSchedule);
    if (text.includes('CONFIRMAR'))
        return gotoFlow(flowConfirm);
};

var welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(conversationalLayer)
    .addAction(mainLayer);

var flow = createFlow([welcomeFlow, flowSeller, flowSchedule, flowConfirm]);

const getInitSettings = async () => {
    try {
        const dataApi = await fetch(MAKE_GET_PROMPTS_TEMPLATE);
        const data = await dataApi.json();
        return data;
    }
    catch (error) {
        console.log({ error: 'Asegurate de iniciar el escenario' });
        return '';
    }
};

const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo-16k');
const PORT = process.env.PORT ?? 3001;
const main = async () => {
    const prompts = await getInitSettings();
    const provider = createProvider(BaileysProvider);
    await createBot({
        database: new MemoryDB(),
        provider,
        flow,
    }, { extensions: { ai, prompts } });
    provider.initHttpServer(+PORT);
    console.log(`[Escanear QR] http://localhost:3000`);
};
main();
