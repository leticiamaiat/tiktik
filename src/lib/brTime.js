// Datas do TIK sempre no horário de Brasília, independente do fuso do
// aparelho: o "dia" (contador Hoje, limites do plano, filtros de data) vira à
// meia-noite de Brasília. Desde 2019 não há horário de verão, então o offset
// é fixo em -03:00.
export const BR_TZ = 'America/Sao_Paulo'
const BR_OFFSET = '-03:00'

// yyyy-mm-dd do instante informado, no calendário de Brasília
export function brDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BR_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(date))
}

// Soma dias a uma data yyyy-mm-dd (aritmética de calendário, sem fuso)
export function addDays(ymd, days) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Início / fim de um dia (yyyy-mm-dd) de Brasília, como ISO em UTC
export function brDayStart(ymd = brDate()) {
  return new Date(`${ymd}T00:00:00${BR_OFFSET}`).toISOString()
}
export function brDayEnd(ymd = brDate()) {
  return new Date(`${ymd}T23:59:59.999${BR_OFFSET}`).toISOString()
}
