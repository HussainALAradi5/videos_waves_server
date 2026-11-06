type LogLevel = 'info' | 'warn' | 'error'

const write = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  if (process.env.NODE_ENV === 'test') return
  const entry = { level, time: new Date().toISOString(), message, ...context }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else console.log(line)
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context)
}
