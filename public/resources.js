const moveControl = document.querySelector('#move')
const message = document.querySelector('#message')
const messageText = message.querySelector('p')
let timeOutWrite = undefined

// #region Paths
const PATH_T_BGS = 'assets/textures/backgrounds/'
const PATH_T_BLOCKS = 'assets/textures/blocks/'
const PATH_T_OBJECTS = 'assets/textures/objects/'
const PATH_T_PLAYERS = 'assets/textures/players/'
const PATH_S_PLAYERS = 'assets/sounds/players/'
const PATH_S_OBJECTS = 'assets/sounds/objects/'
const PATH_MUSIC = 'assets/music/'


function textureBG(namePath) {
    const img = new Image
    img.src = PATH_T_BGS + namePath
    return img
}
function texturePlayer(namePath) {
    const img = new Image
    img.src = PATH_T_PLAYERS + namePath
    return img
}
function textureObject(namePath) {
    const img = new Image
    img.src = PATH_T_OBJECTS + namePath
    return img
}
function textureBlock(namePath) {
    const img = new Image
    img.src = PATH_T_BLOCKS + namePath
    return img
}

// #region Objetos
const objectsTypes = Object.freeze({
    player: Symbol(),
    block: Symbol(),
    platform: Symbol(),
    coin: Symbol(),
    guitar: Symbol(),
})
// #region Texturas
const textures = Object.freeze({
    backgrounds: {
        forest: [
            // textureBG('forest/00.png'),
            textureBG('forest/01.png'),
            textureBG('forest/02.png'),
            textureBG('forest/03.png')
        ],
        front: [
            textureBG('forest/front.png'),
            textureBG('bg.png'),
        ]
    },
    player1: {
        default: texturePlayer('petro_stand.png'),
        crouch: texturePlayer('petro_crouch.png'),
        walk: texturePlayer('petro_walking.png'),
        jump: texturePlayer('petro_jumping.png'),
        fall: texturePlayer('petro_falling.png')
    },
    player2: {
        default: texturePlayer('mariancho_stand.png'),
        walk: texturePlayer('mariancho_walking.png'),
        jump: texturePlayer('mariancho_jumping.png'),
        fall: texturePlayer('mariancho_falling.png')
    },
    player3: {
        default: texturePlayer('mayo_stand.png'),
        walk: texturePlayer('mayo_walking.png'),
        jump: texturePlayer('mayo_jumping.png'),
        fall: texturePlayer('mayo_falling.png')
    },
    player4: {
        default: texturePlayer('mariangelica_stand.png'),
        walk: texturePlayer('mariangelica_walking.png'),
        jump: texturePlayer('mariangelica_jumping.png'),
        fall: texturePlayer('mariangelica_falling.png')
    },
    player5: {
        default: texturePlayer('samuel_stand.png'),
        walk: texturePlayer('samuel_walking.png'),
        jump: texturePlayer('samuel_jumping.png'),
        fall: texturePlayer('samuel_falling.png')
    },
    objects:{
        coin: textureObject('coin.png'),
        guitar: textureObject('guitar.png')
    },
    blocks: {
        block1x1: textureBlock('b_1x1.png'),
        block1x2: textureBlock('b_1x2.png'),
        block3x2: textureBlock('b_3x2.png'),
        block4x3: textureBlock('b_4x3.png'),
        platform4x3: textureBlock('p_4x3.png')
    }
})
// #region Musica
const music = Object.freeze({
    // m0: new Audio(PATH_MUSIC + 'bit-beats-3-168873.mp3'),
    // m1: new Audio(PATH_MUSIC + 'stranger-things-124008.mp3'),
    // m2: new Audio(PATH_MUSIC + 'synthwave-marvel-francis-200494.mp3'),
    m3: new Audio(PATH_MUSIC + 'uplifting-pad-texture-113842.mp3'),
})
// #region Efectos de sonido
const sfx = Object.freeze({
    player: {
        jump: new Audio(PATH_S_PLAYERS + 'jump.mp3'),
        getCoin: new Audio(PATH_S_PLAYERS + 'mayo.ogg'),
    },
    objects: {
        coin: new Audio(PATH_S_OBJECTS + 'coin.mp3'),
        guitar: new Audio(PATH_S_OBJECTS + 'guitar.mp3')
    }
})
// #region Sprites 
const sprites = {
    objects: {
        coin: null,
    }
}

//Extras
function newLoading(steps, callBack) {
    let counter = 0
    let percente = 0
    let step = 1 / steps
    let complete = false
    let output = undefined
    function increment(increment = true) { 
        if (increment) {
            counter++
            percente += step
            if (percente.toFixed(2) >= 1) {
                percente = 1
                if (!complete) {
                    callBack()
                    complete = true
                }
            }
            output = percente
        } else {
            output = counter
        }
        return output
    }
    return increment
}
function stepLoadStyle() {
    bar.style.transform = `scaleX(${load()})`
}
function write(text = '', velocity = 50) {
    let index = 0
    let time = velocity
    if (timeOutWrite) clearTimeout(timeOutWrite)

    const wait = [',', '.', '!', '?']

    message.style.width = 'auto'
    message.style.height = 'auto'
    message.style.padding = '10px 20px'
    message.style.visibility = 'visible'
    messageText.textContent = ''
    messageText.style.opacity = 1

    function writing() {
        if (index < text.length) {
            const letter = text.charAt(index)
            messageText.textContent += letter; index++
            time = wait.includes(letter) ? velocity * 10 : velocity 
            timeOutWrite = setTimeout(writing, time)
        } else {
            const styles = getComputedStyle(message)
            message.style.width = styles.width
            message.style.height = styles.height
            timeOutWrite = setTimeout(() => {
                message.style.width = 0
                message.style.padding = 0
                messageText.style.opacity = 0
                message.style.visibility = 'hidden'
            }, 800)
        }
    }
    writing()
}
function randomNum(n) {
    return Math.floor(Math.random() * n)
} 
function randomColor() {
    let color = 'rgb('
    for (let i = 0; i < 3; i++) color += randomNum(255) + ' '
}
function playSfx(audio, time) {
    audio.currentTime = time || 0
    audio.play()
}

moveControl.ontouchend = function() {
    this.value = 0
    keys['a'] = false
    keys['d'] = false
}
moveControl.oninput = function() {
    console.log(this.value)
    if (this.value < -0.3) {
        keys['a'] = true
    } else if (this.value > 0.3) {
        keys['d'] = true
    } else {
        keys['a'] = false
        keys['d'] = false
    }

}