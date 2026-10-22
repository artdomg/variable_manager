import dayjs from 'dayjs'
import 'dayjs/locale/es'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('es')

export const fromNow = (date: Date | string | number) => dayjs(date).fromNow()
export const fullDate = (date: Date | string | number) => dayjs(date).format('D MMM YYYY, HH:mm')

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
