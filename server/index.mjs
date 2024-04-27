import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'node:http'

const port = process.env.PORT || 3000

const app = express()
const server = createServer(app)
const io = new Server(server)

io.on('connection', socket => {
    socket.on('disconnect', () => {
        io.emit('player-disconnect', socket.id)
    })

    socket.on('player-update', data => {
        socket.broadcast.emit('player-online', data)
    })
})

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/public/index.html')
})
app.get('/getPort', (req, res) => res.send(port))

app.use(express.static('public'))

server.listen(port, () => console.log(`server running on port ${port}`))