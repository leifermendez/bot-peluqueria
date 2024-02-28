import { MAKE_GET_PROMPTS_TEMPLATE } from "src/config"

/**
 * Get  all settings prompts
 * @returns 
 */
export const getInitSettings = async () => {
    try {
        const dataApi = await fetch(MAKE_GET_PROMPTS_TEMPLATE)
        const data = await dataApi.json()
        return data

    } catch (error) {
        console.log({ error: 'Asegurate de iniciar el escenario' })
        return ''
    }
}