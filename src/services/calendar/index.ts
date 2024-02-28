import { format, addMinutes } from 'date-fns'
import { MAKE_ADD_TO_CALENDAR, MAKE_GET_FROM_CALENDAR } from 'src/config'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<string> => {
    const dataCalendarApi = await fetch(MAKE_GET_FROM_CALENDAR)
    const json: any[] = await dataCalendarApi.json()
    const list = json.reduce((prev, current) => {

        if (!current.fecha) return prev

        return prev += [
            `Espacio reservado (no disponible): `,
            `Desde ${format(current.fecha, 'eeee do h:mm a')} `,
            `Hasta ${format(addMinutes(current.fecha, 45), 'eeee do h:mm a')} \n`,
        ].join(' ')
    }, '')
    return list
}

/**
 * add to calendar
 * @param text 
 * @returns 
 */
const appToCalendar = async (text: string) => {
    try {
        const payload = JSON.parse(text)
        console.log(payload)
        const dataApi = await fetch(MAKE_ADD_TO_CALENDAR, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        })
        return dataApi
    } catch (err) {
        console.log(`error: `, err)
    }
}

export { getCurrentCalendar, appToCalendar }