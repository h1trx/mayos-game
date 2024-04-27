import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

const port = 3000

const app = express()
const server = createServer(app)
const io = new Server(server)

io.on('connection', socket => {
    console.log('A user has connected!')

    socket.on('disconnect', () => {
        io.emit('player-disconnect', socket.id)
    })

    socket.on('player-update', data => {
        socket.broadcast.emit('player-online', data)
    })
})

app.get('/', (req, res) => {
    res.sendFile('C:/Users/petro/Documents/game/public/index.html')
})

app.use(express.static('C:/Users/petro/Documents/game/public'))

server.listen(port, () => console.log(`server running on port ${port}`))