import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";


class AIClass {
    private openai: OpenAI;
    private model: string

    constructor(apiKey: string, _model: string) {
        this.openai = new OpenAI({ apiKey, timeout: 15 * 1000 });
        if (!apiKey || apiKey.length === 0) {
            throw new Error("OPENAI_KEY is missing");
        }

        this.model = _model
    }

    /**
     * 
     * @param messages 
     * @param model 
     * @param temperature 
     * @returns 
     */
    createChat = async (
        messages: ChatCompletionMessageParam[],
        model?: string,
        temperature = 0
    ) => {
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
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };

}

export default AIClass;
