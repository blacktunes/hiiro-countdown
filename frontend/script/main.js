// 设置
const width = 1920
const height = 1440

const mid = 508963009

const followerAPI = 'ws://127.0.0.1:5002/'
const bulkActiveAPI = `https://api.tokyo.vtbs.moe/v2/bulkActive/${mid}`

const bgmList = [
  'bgm/真朱の花-short ver.mp3',
  'bgm/薄群青-short ver ver.mp3',
  'bgm/Elements Garden - 一進一退.mp3',
  'bgm/岩橋星実 - INFINITE SKY instrumental ver.mp3'
]
const SE = 'bgm/烟花.mp3'

let target = 1000000
let target_1 = target - 200
let target_2 = target - 100

function setTarget(num) {
  target = num
  target_1 = num - 200
  target_2 = num - 100
}

const startTime = (new Date('2020-2-29 20:00')).getTime()
//-------------------------------------

// PIXI初始化
const app = new PIXI.Application({
  width,
  height,
  transparent: true
})

app.view.width = width
app.view.height = height
app.view.className = 'canvas'

document
  .getElementById('main')
  .appendChild(app.view)
//-------------------------------------

// 加载图片资源
const loader = new PIXI.Loader()
loader
  .add('bg_0', 'image/0.jpg')
  .add('bg_1', 'image/1.png')
  .add('bg_2', 'image/2.png')
  .add('bg_3', 'image/3.png')
  .add(SE)
  .load(setup)
//-------------------------------------

// 创建文字
const defaultStyle = {
  fontFamily: 'SIYUAN',
  lineHeight: height
}

const textList = []

function createText(text, style, y) {
  const line = new PIXI.Text(text, { ...defaultStyle, ...style })
  line.anchor.x = 0.5
  line.x = width / 2
  line.y = y
  line.alpha = 0
  textList.push(line)
}

const loading = new PIXI.Text('Loading', { ...defaultStyle, fontFamily: 'Arial', fontSize: 140, fill: 0x555555 })
loading.anchor.x = 0.5
loading.x = (width / 2) + 40
loading.y = 600

createText(1, {
  fontSize: 130,
  fill: 0x717171
}, 280)
createText('to', {
  fontSize: 80,
  fill: 0xffffff
}, 460)
createText('-', {
  fontSize: 150,
  letterSpacing: 30,
  fill: 0x000000
}, 580)
createText('', {
  fontSize: 80,
  letterSpacing: 20,
  fill: [
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0x000000,
    0xffffff
  ],
  fillGradientType: 2
}, 740)
createText('', {
  fontSize: 60,
  fill: 0x000000
}, 890)
createText('span', {
  fontSize: 50,
  letterSpacing: 10,
  fill: 0xffffff
}, 950)
createText('2020·2·29  20:00', {
  fontSize: 50,
  fill: 0x636363
}, 1020)
//-------------------------------------

const bgBlurFilter = new PIXI.filters.BlurFilter()
bgBlurFilter.blur = 20

let WS

function webSocketInit() {
  if (end) return

  WS = new WebSocket(followerAPI)

  WS.onopen = () => {
    isLoading = false

    if (end) return
    clearInterval(timer)
    timer = setInterval(getTime, 1000)
    stop = false
  }

  WS.onclose = () => {
    stopGetTime(!isLoading)
    setTimeout(webSocketInit, 5000)
  }

  WS.onmessage = e => {
    if (e.data == 0) {
      stopGetTime()
      getTime(true)
      return
    }
    if (e.data >= target) {
      finish()

      fetch(bulkActiveAPI)
        .then(res => res.json())
        .then(res => {
          const index = res.findIndex(item => item.follower >= target)
          if (index !== -1) {
            const endTime = new Date(res[index].time)
            textList[3].text = `${((endTime.getTime() - startTime) / 1000) | 0}S`
            textList[4].text = `${endTime.getFullYear()}·${endTime.getMonth() + 1}·${endTime.getDate()}  ${endTime.getHours() <= 9 ? 0 : ''}${endTime.getHours()}:${endTime.getMinutes() <= 9 ? 0 : ''}${endTime.getMinutes()}`

          } else {
            getTime(true)
          }
        })
    } else {
      getTime()
      textList[2].text = e.data

      if (e.data >= target_2) {
        playBgm(bgmList[2])
      } else if (e.data >= target_1) {
        playBgm(bgmList[1])
      } else {
        playBgm(bgmList[0])
      }
    }
  }
}

function finish() {
  end = true
  stopGetTime()
  textList[2].text = target
  WS.close()

  if (click) {
    if (bgm && bgm.data) {
      bgm.data.pause()
    }
    const baba = loader.resources[SE].data
    baba.play()
    baba.onended = () => {
      playBgm(bgmList[3])
      imageShow()
    }
  } else {
    playBgm(bgmList[3])
    imageShow()
  }
}

let timer = null
let isLoading = true
let isReady = false

function setup() {

  const bg_0 = new PIXI.Sprite(loader.resources['bg_0'].texture)

  const bg_1 = new PIXI.Sprite(loader.resources['bg_1'].texture)
  bg_1.x = 980
  bg_1.y = 715
  bg_1.anchor.set(0.5)

  const bg_2 = new PIXI.Sprite(loader.resources['bg_2'].texture)
  bg_2.filters = [bgBlurFilter]

  const bg_3 = new PIXI.Sprite(loader.resources['bg_3'].texture)

  app.stage.addChild(bg_0)
  app.stage.addChild(bg_1)
  app.stage.addChild(bg_2)
  app.stage.addChild(bg_3)

  app.stage.addChild(loading)

  for (child of textList) {
    app.stage.addChild(child)
  }

  app.ticker.add(delta => {
    if (end) {
      bg_1.rotation = 70
    } else {
      if (!stop) {
        bg_1.rotation += (0.05 * delta)
      }
    }

    if (!isLoading && !isReady) {
      if (loading.alpha > 0) {
        loading.alpha -= (0.03 * delta)
      } else {
        for (child of textList) {
          if (child.alpha < 1) {
            child.alpha += (0.03 * delta)
          }
        }
        if (textList[textList.length - 1].alpha >= 1) {
          app.stage.removeChild(loading)
          isReady = true
        }
      }
    }
  })
  webSocketInit()
}

let stop = false
let end = false
function getTime(_flag) {
  if (_flag || !end) {
    const nowTime = new Date()
    textList[3].text = `${((nowTime.getTime() - startTime) / 1000) | 0}S`
    textList[4].text = `${nowTime.getFullYear()}·${nowTime.getMonth() + 1}·${nowTime.getDate()}  ${nowTime.getHours() <= 9 ? 0 : ''}${nowTime.getHours()}:${nowTime.getMinutes() <= 9 ? 0 : ''}${nowTime.getMinutes()}`
  }
}

function stopGetTime(_flag) {
  clearInterval(timer)
  timer = null
  if (_flag) stop = _flag
}

function imageShow() {
  if (bgBlurFilter.blur > 0) {
    bgBlurFilter.blur -= 1
    setTimeout(imageShow, 50)
  }
}

// BGM
let bgm = null
let click = false
let pause = true

document.addEventListener('click', () => {
  click = true
}, { once: true })

function changeBgm() {
  if (!(bgm && bgm.data)) return

  if (pause) {
    pause = false
    bgm.data.play()
    document.getElementById('btn').src = 'image/音量.png'
  } else {
    pause = true
    bgm.data.pause()
    document.getElementById('btn').src = 'image/静音.png'
  }
}

function playBgm(name) {
  if (bgm && bgm.data && bgm.name !== name) {
    bgm.data.pause()
  }
  if (loader.resources[name]) {
    if (click && bgm.name !== name) {
      if (pause) return
      bgm.data.play()
    }
    return
  }
  loader
    .add(name)
    .load(() => {
      document.getElementById('btn').style.display = 'block'
      bgm = loader.resources[name]
      bgm.data.loop = true
      if (click) {
        if (pause) return
        bgm.data.play()
      }
    })
}
//-------------------------------------
