const canvas = document.querySelector('canvas')
const uhd = document.querySelector('#uhd')
const bar = uhd.querySelector('#loading span')
canvas.height = 180; canvas.width = canvas.height / window.innerHeight * window.innerWidth
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false

// #region Variables
const GRID =        Array.from({length: 6}, () => Array(10).fill([]))
const CLMS =        canvas.width / GRID[0].length
const ROWS =        canvas.height / GRID.length
const CUBE_SIZE =   16
let idCounter =     0
let player =        undefined
let onlinePlayers = []
let musicNow =      undefined
let cameraX =       0
let cameraY =       0
let bgColor =      'whitesmoke'
let gravity =       0.3
let keys =          []
let coins =         []
let OBJECTS =       [] 

// #region Clases
class Sprite {
    constructor(name, img, fps, isInfinity, columns = 1, rows = 1) {
        this.name = name
        this.img = img
        this.fps = fps
        this.isInfinity = isInfinity
        this.x = 0; this.y = 0
        this.w = img.width/columns
        this.h = img.height/rows
        this.frame = 0
    }
}
class Player {
    constructor(x, y, w, h, initSprite) {
        this.id = idCounter++
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.dx = 0
        this.dy = 0
        this.jump = 4.6
        this.fall = true
        this.speed = 0.5
        this.friction = 0.85
        this.gridIndex = {}
        this.objType = objectsTypes.player
        this.objCollision = null
        this.sprite = null
        this.sprites = []
        this.sprites.push(initSprite)
        this.sprite = this.sprites[0]
        this.direction = 1
        this.fixedY = 1
        this.maxSpeed = this.speed * 4
        this.draw = () => drawSprite(this)
    }
    changeSprite(name) {
        const sprite = this.sprites.find(s => s.name === name)
        if (this.sprite.name !== name && sprite) {
            sprite.x = 0
            sprite.frame = 0
            this.sprite = sprite
        }
    }
    move() {
        if ((keys['arrowup'] || keys['w']) && !this.fall) {
            this.changeSprite('jump')
            this.fall = true
            this.dy -= this.jump
            this.dx /= 2
            playSfx(sfx.player.jump)
            if (keys['a']) this.direction = -1
            else if (keys['d']) this.direction = 1
        } 

        //Gravity and Friction
        this.fall ? this.dy += gravity : this.dx *= this.friction

        if (this.dy > 0) this.changeSprite('fall')

        if (!this.fall && (keys['arrowdown'] || keys['s'])) {
            this.changeSprite('crouch')
        } else if (keys['arrowleft'] || keys['a']) {
            this.dx -= this.speed * 4/3
            if (!this.fall) {
                this.changeSprite('walk')
                this.direction = -1
            }
        } else if (keys['arrowright'] || keys['d']) {
            this.dx += this.speed * 4/3
            if (!this.fall) {
                this.changeSprite('walk')
                this.direction = 1
            }
        } else if (this.dy > 0) {
            this.changeSprite('fall')
        } else if (!this.fall) {
            this.changeSprite('default')
        }

        //Limit of map
        if (this.x + this.dx < 0) {
            this.x = 0
            if (this.dx < 0) this.dx = 0
            
        } else if (this.x + this.dx > 10000) {
            this.x = 10000
            if (this.dx > 0) this.dx = 0
        }

        this.dx = Math.min(this.maxSpeed, 20, Math.max(-this.maxSpeed, -20, this.dx))

        //Add the movent
        this.x += Math.round(this.dx)
        this.y += this.dy
    }
    coll() {
        let objFound = undefined

        for (let i = this.gridIndex.y1 - 1; i < this.gridIndex.y2; i++) {
            if (!GRID[i + 1]) continue
            for (let j = this.gridIndex.x1 - 1; j < this.gridIndex.x2; j++) {
                const casilla = GRID[i + 1][j + 1]
                if (!casilla) continue
                casilla.forEach(obj => {
                    if (obj === this || obj === objFound) return

                    // obj.hitbox = true

                    // ctx.fillStyle = '#13e3ff7d'
                    // ctx.fillRect(obj.x, obj.y, obj.w, obj.h)

                    let intX = this.x < obj.x + obj.w && this.x + this.w > obj.x
                    
                    if (this.dx > 0) {
                        intX = this.x + this.w + this.dx > obj.x && this.x < obj.x + obj.w - this.dx
                    } else if (this.dx < 0) {
                        intX = this.x + this.dx < obj.x + obj.w && this.x + this.w > obj.x + this.dx
                    }

                    const isIntersection = intX && this.y <= obj.y + obj.h && this.y + this.h >= obj.y

                    if (isIntersection) {
                        switch (obj.objType) {
                            case objectsTypes.block:
                                if (this.dy >= 0 && this.y + this.h - this.dy <= obj.y) {
                                    this.dy = 0
                                    this.y = obj.y - this.h
                                    this.fall = false
                                } else if (this.dx > 0 && this.x - this.dx < obj.x) {
                                    this.dx = 0
                                    this.x = obj.x - this.w
                                } else if (this.dx < 0 && this.x + this.w > obj.x + obj.w + this.dx) {
                                    this.dx = 0
                                    this.x = obj.x + obj.w
                                } else {
                                    this.fall = true
                                }
                            break
                            case objectsTypes.platform:
                                if (this.dy >= 0 && this.y + this.h - this.dy <= obj.y) {
                                    this.dy = 0
                                    this.y = obj.y - this.h
                                    this.fall = false
                                } else {
                                    this.fall = true
                                }
                            break
                            case objectsTypes.coin:
                                obj.delete()
                                playSfx(sfx.objects.coin)
                                playSfx(sfx.player.getCoin, 0.4)
                                write('¡Arajo! Esta platica no me cae nada mal.', 30)
                            break
                            case objectsTypes.guitar:
                                obj.delete()
                                playSfx(sfx.objects.guitar, 1.2)
                                write('Has encontrado una guitarra. ¡Genial!')
                            break
                        }
                        objFound = obj
                    }
                }) 
            }
        }
        
        if (objFound) {
            this.objCollision = objFound
        } else {
            this.fall = true
            this.objCollision = null
        }
    }
    update() {
        this.move()
        this.coll()

        //Dont fall out canvas
        if (this.y + this.h > canvas.height - this.fixedY - 16) {
            this.dy = 0; this.fall = false
            this.y = canvas.height - this.h - 16
        }

        updateGrid(this)

        const limitLeft = canvas.width/2 - this.w
        const moveX = Math.round(this.dx)

        
        if (player.x >= limitLeft) {
            moveCamera(-moveX, 0)
        } else {
            moveCamera(cameraX, 0)
        }
        // if (this.y > 114) {  moveCamera(0, cameraY) } else moveCamera(0, -this.dy)
    
        this.draw()
        // ctx.fillStyle = "#f004"
        // ctx.fillRect(this.x, this.y, this.w, this.h)
    }
}
class Obj {
    constructor(x, y, w, h, name) {
        this.id = idCounter++
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.gridIndex = {}
        this.texture = textures.objects[name]
        this.objType = objectsTypes[name]
        this.hitbox = false
    }
    draw() {
        ctx.beginPath()

        ctx.drawImage(this.texture, this.x, this.y)

        if (this.hitbox) {
            ctx.fillStyle = '#13e3ff7d'
            ctx.fillRect(this.x, this.y, this.w, this.h)
            this.hitbox = false
        }

        ctx.closePath()
    }
    delete() {
        OBJECTS = OBJECTS.filter(object => object.id != this.id)
    }
    update() {
        if (this.x + this.h > 0 && this.x < canvas.width + cameraX) {
            updateGrid(this)
            this.draw()
        }
    }
}
class Coin {
    constructor(x, y) {
        this.id = idCounter++
        this.x = x
        this.y = y
        this.w = 8
        this.h = 8
        this.indexTree = {}
        this.objType = objectsTypes.coin
        this.hitbox = false
    }
    delete() {
        coins = coins.filter(coin => coin.id != this.id)
    }
}

// #region Funciones
function responsive() {
    canvas.width = canvas.height / window.innerHeight * window.innerWidth
    ctx.translate(-cameraX, cameraY)
}
function drawGrid() {
    ctx.beginPath()
    ctx.strokeStyle = '#acf1'
    ctx.lineWidth = 1

    for (let i = 0; i < GRID[0].length + 1; i++) {
        const x = Math.round(i * CLMS) + cameraX
        const y = canvas.height
        ctx.moveTo(x, 0)
        ctx.lineTo(x, y)
        ctx.stroke()
    }
    for (let i = 0; i < GRID.length + 1; i++) {
        const x = canvas.width + cameraX
        const y = Math.round(i * ROWS)
        ctx.moveTo(0, y)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    ctx.closePath()
}
function updateGrid(obj) {
    let vx = 0
    let vy = 0

    if (obj.objType === objectsTypes.player) {
        vx = obj.dx; vy = obj.dy
    }

    let y1 = Math.floor((obj.y + vy - cameraY)/ ROWS)
    let x1 = Math.floor((obj.x + vx - cameraX)/ CLMS)
    let y2 = Math.floor((obj.y + obj.h + vy - cameraY) / ROWS)
    let x2 = Math.floor((obj.x + obj.w + vx - cameraX) / CLMS)

    for (let i = y1 - 1; i < y2; i++) {
        if (!GRID[i + 1]) continue
        for (let j = x1 - 1; j < x2; j++) {
            const objects = GRID[i + 1][j + 1]
            if (!objects) continue
            if (!objects.some(o => o.id === obj.id)) {
                objects.push(obj)
                obj.gridIndex = { x1, y1, x2, y2 }
            }
        }   
    }   
    
}
function drawSprite(obj) {
    const sprite = obj.sprite
    const img = sprite.img

    if (sprite.frame > (60 / sprite.fps)) {
        if (sprite.x + sprite.w >= img.width) {
            if (sprite.isInfinity) sprite.x = 0
        } else { sprite.x += sprite.w }
        sprite.frame = 0
    } else sprite.frame++

    let canvasX = (obj.x - (sprite.w - obj.w)/2) * obj.direction
    let canvasY = obj.y + obj.fixedY - (sprite.h - obj.h)

    ctx.beginPath()
    
    if (obj.direction === -1) {
        ctx.save()
        ctx.scale(-1, 1)
        canvasX -= sprite.w
    }

    ctx.drawImage(
        img,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h,
        canvasX,
        canvasY,
        sprite.w,
        sprite.h
    );

    if (obj.direction === -1) ctx.restore()

    ctx.closePath()
}
function drawGroup(objects, sprite) {
    const img = sprite.img

    if (sprite.frame > (60 / sprite.fps)) {
        sprite.x = (sprite.x + sprite.w >= img.width) ? 0 : sprite.x + sprite.w
        sprite.frame = 0
    } else sprite.frame++

    ctx.beginPath()
    objects.forEach(obj => {
        if (obj.x + obj.h < 0 || obj.x > canvas.width + cameraX) return 

        let canvasX = obj.x - (sprite.w - obj.w)/2
        let canvasY = obj.y - (sprite.h - obj.h)/2

        ctx.drawImage(
            img,
            sprite.x,
            sprite.y,
            sprite.w,
            sprite.h,
            canvasX,
            canvasY,
            sprite.w,
            sprite.h
        )

        if (obj.hitbox) {
            ctx.fillStyle = '#13e3ff7d'
            ctx.fillRect(obj.x, obj.y, obj.w, obj.h)
            obj.hitbox = false
        }

        updateGrid(obj)
    })
    ctx.closePath()
}
function moveCamera(x , y) {
    cameraX -= x
    cameraY -= y
    ctx.translate(x, y)
}
function drawBG(name) {
    textures.backgrounds[name].forEach((layer, index) => {
        let translateX = 0
        
        switch (index) {
            case 0:
                translateX = cameraX / 4
            break
            case 1:
                translateX = cameraX / 2
            break
            case 2:
                translateX = cameraX
            break
        }
        
        if (cameraX - translateX >= layer.width) translateX -= layer.width

        const W = Math.min(layer.width, canvas.width) - translateX
        const H = Math.min(layer.height, canvas.height)
        const restante = canvas.width - layer.width + translateX

        ctx.beginPath()
        ctx.drawImage(layer, translateX, 0, W, H, cameraX, cameraY, W, H)
        ctx.drawImage(layer, 0, 0, restante, H, cameraX + canvas.width - restante, 0, restante, layer.height)
        ctx.closePath()

        // ctx.beginPath()
        // ctx.drawImage(layer, cameraX - translateX, 0)
        // ctx.drawImage(layer, 0, 0, restante, H, cameraX + canvas.width - restante, 0, restante, layer.height)
        // ctx.closePath()
    })
}
function createPlayer(n) {
    const playerTexture = textures[`player${n}`]
  
    let firstSprite = new Sprite('default', playerTexture.default, 0.5, true, 2)

    player = new Player(Math.min(100, Math.round((canvas.width/2) - 16)), canvas.height - 24, 6, 24, firstSprite)
    player.playerNumber = n

    player.sprites.push(new Sprite('walk', playerTexture.walk, 10, true, 3))
    player.sprites.push(new Sprite('jump', playerTexture.jump, 20, false, 2))
    player.sprites.push(new Sprite('fall', playerTexture.fall, 10, true, 2))
    if (playerTexture.crouch) player.sprites.push(new Sprite('crouch', playerTexture.crouch, 1, true, 2))
}
function createObject(x, y, w, h, name) {
    const OBJ = new Obj(x, y, w, h, name)
    OBJECTS.push(OBJ)
    return OBJ
}

// #region Inicialización
window.onresize = responsive

const load = newLoading(40, () => {
    createPlayer(3)

    sprites.objects.coin = new Sprite('default', textures.objects.coin, 8, true, 4, 1)
    coins.push(new Coin(245, canvas.height - 60))
    coins.push(new Coin(270, canvas.height - 60))
    createObject(450, 155 - 20, 11, 24, 'guitar')

    musicNow = music.m0

    setTimeout(() => {
        uhd.removeChild(uhd.querySelector('aside'))

        document.onkeydown = e => {
            const k = e.key.toLowerCase()
            if (k === 'enter') return (game.id) ? game.pause() : game.play()
            if (k > 0 && k < 6) return createPlayer(k)
            keys[k] = true
        }
        document.onkeyup = e => {
            const k = e.key.toLowerCase()
            keys[k] = false
        }

        console.log(`Se cargaron ${load(false)} recursos.`)

        game.play()
    }, 100)
})

for (let pack in textures) {
    switch (pack) {
        case 'backgrounds':
            for (let bg in textures[pack]) {
                textures[pack][bg].forEach(layer => layer.onload = function() {
                    stepLoadStyle()
                    this.onload = null
                })
            }
        break
        default: 
            for (let texture in textures[pack]) {
                textures[pack][texture].onload = function() {
                    stepLoadStyle()
                    this.onload = null
                }
            }
        break
    }
}
for (let song in music) {
    music[song].oncanplay = function() {
        stepLoadStyle()
        this.oncanplay = null
        musicNow = this
    }
}
for (let pack in sfx) {
    for (let sound in sfx[pack]) {
        sfx[pack][sound].oncanplay = function() {
            stepLoadStyle()
            this.oncanplay = null
        }
    }
}

// #region Game start
const game = {
    id: null,
    fps: 0,
    reg: 0,
    play() {
        game.loop()
        musicNow.play()
        musicNow.onend = function() {
            musicNow = music.m2
            this.play()
        }
        uhd.querySelector('#game-state').innerText = ''
    },
    loop(timeLap) {
        //Fps counter
        game.fps++

        if (timeLap - game.reg > 999) {
            uhd.querySelector('#fps-counter').innerText = game.fps
            game.reg = timeLap; game.fps = 0
        }

        //Draw background
        ctx.fillStyle = bgColor
        ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height)
        drawBG('forest')
        
        //Reset grid
        GRID.forEach((value, y) => {
            GRID[y].forEach((value, x) => {
                GRID[y][x] = []
            })
        })

        //Draw objets
        OBJECTS.forEach(object => object.update())

        drawGroup(coins, sprites.objects.coin)

        onlinePlayers.forEach(player => drawSprite(player))

        player.update()

        ctx.drawImage(textures.backgrounds.front[1], cameraX, 0, canvas.width, 16, cameraX, canvas.height - 16, canvas.width, 16)
        ctx.drawImage(textures.backgrounds.front[0], 600 + cameraX - (player.x * 5/4), cameraY)

        game.id = requestAnimationFrame(game.loop, timeLap)  

        if (socket) {
            socket.emit('player-update', {
                socketId: socket.id,
                x: player.x,
                y: player.y,
                w: player.w,
                h: player.h,
                fixedY: player.fixedY,
                direction: player.direction,
                playerNumber: player.playerNumber,
                sprite: {...player.sprite, img: null }
            })    
        }

        X.innerText = player.x
        Y.innerText = -Math.round(player.y)
    },
    pause() {
        musicNow.pause()
        cancelAnimationFrame(game.id); game.id = null
        uhd.querySelector('#game-state').innerText = 'PAUSED'
    }
}

if (socket) {
    socket.on('player-online', playerOn => {
        const isInGame = onlinePlayers.find(player => player.socketId === playerOn.socketId)
        playerOn.sprite.img = textures[`player${playerOn.playerNumber}`][playerOn.sprite.name]
        
        if (isInGame) {
            const index = onlinePlayers.indexOf(isInGame)
            onlinePlayers[index] = playerOn
        } else {
            onlinePlayers.push(playerOn)
        }
    })
    socket.on('player-disconnect', id => {
        onlinePlayers = onlinePlayers.filter(player => player.socketId != id)
    })
}

document.getElementById('c_input').oninput = function() { bgColor = this.value }
document.getElementById('g_input').oninput = function() { gravity = Number(this.value) }
document.getElementById('j_input').oninput = function() { player.jump = Number(this.value) }
document.getElementById('f_input').oninput = function() { player.friction = 1 - Number(this.value) }
document.getElementById('s_input').oninput = function() { player.speed = Number(this.value); player.maxSpeed = this.value * 4 }

const X = document.querySelector('#x')
const Y = document.querySelector('#y')