const { beforeEach, test } = require('tap') 
    , nanosocket = require('./')
    , delay = require('utilise/delay')
    , { WebSocket, fakeTimeout } = require('global-mocks')
    , windpw = global.window = { WebSocket, setTimeout: fakeTimeout }

beforeEach(async () => {
  global.window = { WebSocket, setTimeout: fakeTimeout, location: { origin: 'http' } }
  WebSocket.sockets = []
  fakeTimeout.timeouts = []
})

test('should create socket to current origin', ({ same, plan }) => {
  plan(2)

  window.location.origin = 'http://foo.bar'
  nanosocket()
  same(WebSocket.sockets.pop().location, 'ws://foo.bar', 'http origin')

  window.location.origin = 'https://foo.bar'
  nanosocket()
  same(WebSocket.sockets.pop().location, 'wss://foo.bar', 'https origin')
})

test('should reconnect socket with exponential backoff', async ({ same, plan }) => {
  plan(1)
  const io = nanosocket()
      , keepClosing = async max => {
          for (let i = 0; i < max; i++) {
            await delay()
            WebSocket.sockets.pop().onclose()
          }
        }

  await keepClosing(10)

  same(fakeTimeout.timeouts.map(d => d.ms), [
    200
  , 400
  , 800
  , 1600
  , 3200
  , 6400
  , 10000
  , 10000
  , 10000
  , 10000
  ])
})

test('should resolve promise when sent - before socket opened', ({ same, plan }) => {
  plan(1)
  const io = nanosocket()
      , ws = WebSocket.sockets.pop()

  io.send('foo')
    .then(d => same(ws.sent.length, 1, 'message sent before socket opened'))

  ws.onopen()
})

test('should resolve promise when sent - after socket opened', ({ same, plan }) => {
  plan(1)
  const io = nanosocket()
      , ws = WebSocket.sockets.pop()

  ws.onopen()
  io.send('foo')
    .then(d => same(ws.sent.length, 1, 'message sent after socket opened'))
})

test('should resolve promise when sent - during socket reconnecting', async ({ same, plan }) => {
  plan(1)
  const io = nanosocket()
      , ws1 = WebSocket.sockets.pop()

  // connect
  ws1.onopen()
  // disconnect
  ws1.onclose()
  // send
  const sent = io.send('foo')
  // wait
  await delay(10)
  // reconnect
  const ws2 = WebSocket.sockets.pop()
  ws2.onopen()

  await sent
  same(ws2.sent.length, 1, 'message sent after socket opened')
})

test('should emit on receiving message', ({ same, plan }) => {
  plan(1)
  const io = nanosocket()
      , ws = WebSocket.sockets.pop()

  io.on('recv')
    .map(d => same(d, 'foo'))

  ws.onmessage({ data: 'foo' })
})