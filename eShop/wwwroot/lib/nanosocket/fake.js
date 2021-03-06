const { emitterify } = require('utilise/pure')

module.exports = function(){
  const socket = emitterify()
  socket.sent = []
  socket.send = d => Promise.resolve(socket.sent.push(d))
  return socket
}
