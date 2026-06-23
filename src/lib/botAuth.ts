export function verifyBotToken(request: Request): boolean {
  const token = request.headers.get('x-bot-token')
  return token === process.env.BOT_SECRET_TOKEN
}
