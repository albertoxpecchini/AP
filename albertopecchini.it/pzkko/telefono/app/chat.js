// L'app Chat: il bot dei $pzk (chat/chat.js) montato dentro il telefono. Resta montata quando si torna alla home, così i
// messaggi e le partite in corso non si perdono.
import * as chat from '../../chat/chat.js'

export function monta(host) {
  chat.monta(host)
  return { mostra: (opz) => chat.mostra(opz?.comando) }
}
