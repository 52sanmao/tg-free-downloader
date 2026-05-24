import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { Api } from 'telegram'
import { storeSession } from './session'
import { getApiId, getApiHash } from './config'

let client = null

export function getClient() {
  return client
}

export async function initClient(sessionStr) {
  const stringSession = new StringSession(sessionStr || '')
  client = new TelegramClient(stringSession, getApiId(), getApiHash(), {
    connectionRetries: 5,
    useWSS: false,
  })
  return client
}

export async function connectClient() {
  if (!client) throw new Error('Client not initialized')
  await client.connect()
  if (await client.isUserAuthorized()) {
    const me = await client.getMe()
    storeSession(client.session.save())
    return { authorized: true, user: me }
  }
  return { authorized: false }
}

/* QR Code Login */
export function onQRUpdate(cb) {
  if (!client) return
  client.addEventHandler((update) => {
    if (update instanceof Api.UpdateLoginToken) {
      cb('token')
    }
  })
}

export async function getQRLogin() {
  if (!client) throw new Error('Client not initialized')
  const result = await client.invoke(new Api.auth.ExportLoginToken({
    apiId: getApiId(),
    apiHash: getApiHash(),
    exceptIds: [],
  }))

  if (result instanceof Api.auth.LoginToken) {
    return { type: 'qr', token: result.token }
  }
  return { type: 'already' }
}

export async function checkQRLogin() {
  if (!client) throw new Error('Client not initialized')
  try {
    const result = await client.invoke(new Api.auth.ExportLoginToken({
      apiId: getApiId(),
      apiHash: getApiHash(),
      exceptIds: [],
    }))

    if (result instanceof Api.auth.LoginTokenSuccess) {
      const user = result.authorization.user
      storeSession(client.session.save())
      return { authorized: true, user }
    }

    if (result instanceof Api.auth.LoginTokenMigrateTo) {
      return { migrate: true, dcId: result.dcId }
    }
  } catch (e) {
    if (e.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      return { needs2fa: true }
    }
  }
  return null
}

export async function signInWithQRPassword(password) {
  if (!client) throw new Error('Client not initialized')
  await client.invoke(new Api.auth.CheckPassword({
    password: await client._getPassword(password),
  }))
  storeSession(client.session.save())
}

/* Phone Login */
export async function sendCode(phone) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.invoke(new Api.auth.SendCode({
    phoneNumber: phone,
    apiId: getApiId(),
    apiHash: getApiHash(),
    settings: new Api.CodeSettings({ allowFlashcall: true, currentNumber: true, allowAppHash: true }),
  }))
  return result
}

export async function signIn(phone, code, phoneCodeHash) {
  if (!client) throw new Error('Client not initialized')
  try {
    await client.invoke(new Api.auth.SignIn({
      phoneNumber: phone,
      phoneCode: code,
      phoneCodeHash: phoneCodeHash,
    }))
  } catch (e) {
    if (e.errorMessage === 'SESSION_PASSWORD_NEEDED') return { needs2fa: true }
    throw e
  }
  storeSession(client.session.save())
  return { needs2fa: false }
}

export async function signInWithPassword(password) {
  if (!client) throw new Error('Client not initialized')
  await client.invoke(new Api.auth.CheckPassword({
    password: await client._getPassword(password),
  }))
  storeSession(client.session.save())
}

/* Dialogs & Messages */
export async function getDialogs(limit = 200) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.getDialogs({ limit, archived: false })
  return result.map((d) => ({
    id: d.id?.value?.toString() || d.id.toString(),
    name: d.name || d.title || 'Unknown',
    unreadCount: d.unreadCount || 0,
    lastMessage: d.message?.message?.slice(0, 100) || '',
    date: d.date,
    pinned: d.pinned || false,
    photo: d.photo,
    entity: d.entity,
  }))
}

export async function getMessages(chatId, limit = 50, offsetId = 0) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.getMessages(chatId, { limit, offsetId })
  return result.map((m) => ({
    id: m.id,
    message: m.message,
    date: m.date,
    media: m.media,
    fileSize: m.file?.size,
    fileName: m.file?.name,
    hasMedia: !!m.media,
    fromId: m.fromId?.userId?.value?.toString() || m.fromId?.value?.toString(),
    peerId: m.peerId?.value?.toString(),
    noforwards: m.noforwards,
    mediaType: m.media?.className || null,
    raw: m,
  }))
}

export async function getMessageById(chatId, messageId) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.getMessages(chatId, { ids: messageId })
  if (!result || result.length === 0) return null
  const m = result[0]
  return {
    id: m.id, message: m.message, date: m.date,
    media: m.media, hasMedia: !!m.media, fileSize: m.file?.size,
    fileName: m.file?.name, noforwards: m.noforwards,
    mediaType: m.media?.className || null, raw: m,
  }
}

/* Media Download - Break through save restrictions */
export async function downloadMedia(message, outputPath, progressCallback) {
  if (!client) throw new Error('Client not initialized')
  const msg = message.raw || message

  // For protected media (noforwards/can't save), we download directly via file reference
  // GramJS downloadMedia uses MTProto file download which bypasses client-side save restrictions
  const result = await client.downloadMedia(msg, {
    outputFile: outputPath,
    progressCallback: (p) => { if (progressCallback) progressCallback(Math.round(p * 100)) },
    workers: 10,
  })
  return result
}

export async function downloadBulk(chatId, messageIds, outputDir, onProgress) {
  if (!client) throw new Error('Client not initialized')
  const results = []
  for (let i = 0; i < messageIds.length; i++) {
    try {
      const msg = await getMessageById(chatId, messageIds[i])
      if (!msg || !msg.hasMedia) {
        results.push({ id: messageIds[i], status: 'skipped' })
        continue
      }
      const ext = getFileExtension(msg)
      const path = `${outputDir}/${messageIds[i]}${ext}`
      await downloadMedia(msg, path, (p) => {
        if (onProgress) onProgress(i, messageIds.length, p)
      })
      results.push({ id: messageIds[i], status: 'done', path })
    } catch (e) {
      results.push({ id: messageIds[i], status: 'failed', error: e.message })
    }
  }
  return results
}

function getFileExtension(msg) {
  if (msg.fileName) return '.' + msg.fileName.split('.').pop()
  if (msg.mediaType === 'MessageMediaPhoto') return '.jpg'
  if (msg.mediaType === 'MessageMediaDocument') {
    const doc = msg.raw?.media?.document
    if (doc && doc.mimeType) {
      const map = { 'video/mp4': '.mp4', 'audio/mpeg': '.mp3', 'application/pdf': '.pdf',
        'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
        'video/mpeg': '.mpg', 'audio/ogg': '.ogg', 'video/quicktime': '.mov' }
      return map[doc.mimeType] || '.bin'
    }
  }
  return '.bin'
}

/* Search */
export async function searchMessages(chatId, query, limit = 50, offsetId = 0) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.invoke(new Api.messages.Search({
    peer: chatId,
    q: query,
    filter: new Api.InputMessagesFilterEmpty(),
    limit,
    offsetId,
  }))
  return result.messages.map((m) => ({
    id: m.id, message: m.message, date: m.date,
    hasMedia: !!m.media, mediaType: m.media?.className || null,
    peerId: m.peerId?.value?.toString(),
  }))
}

export async function searchGlobalMessages(query, limit = 30) {
  if (!client) throw new Error('Client not initialized')
  const result = await client.invoke(new Api.messages.SearchGlobal({
    q: query, filter: new Api.InputMessagesFilterEmpty(),
    limit, rate: 0,
  }))
  return result.messages.map((m) => ({
    id: m.id, message: m.message, date: m.date,
    hasMedia: !!m.media, chatId: m.peerId?.value?.toString(),
  }))
}

/* Forward & Send */
export async function forwardMessages(fromChatId, toChatId, messageIds) {
  if (!client) throw new Error('Client not initialized')
  await client.invoke(new Api.messages.ForwardMessages({
    fromPeer: fromChatId, id: messageIds, toPeer: toChatId,
  }))
}

export async function sendMessage(chatId, text, file) {
  if (!client) throw new Error('Client not initialized')
  const opts = file ? { message: text, file } : { message: text }
  await client.sendMessage(chatId, opts)
}

/* Proxy */
export async function detectProxy() {
  if (!client) throw new Error('Client not initialized')
  return client._connection ? true : false
}

export async function setProxy(type, ip, port, secret) {
  if (!client) throw new Error('Client not initialized')
  let proxy
  if (type === 'mtproto') {
    proxy = { ip, port, secret, MTProxy: true }
  } else if (type === 'socks') {
    proxy = { ip, port, socksType: 5 }
  }
  if (proxy) {
    client.setProxy(proxy)
  }
}

/* User */
export async function getMe() {
  if (!client) throw new Error('Client not initialized')
  return client.getMe()
}

export async function disconnect() {
  if (client) {
    await client.disconnect()
    client = null
  }
}
