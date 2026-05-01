import { useEffect, useRef } from 'react'

// ── Fish definitions — type drives movement behavior ──────────────────────
const FISH_FILES = [
  { src: '/fish/clownfish.svg',  w: 220, h: 140, scale: 1.0,  type: 'swim'     },
  { src: '/fish/bluetang.svg',   w: 220, h: 140, scale: 0.95, type: 'swim'     },
  { src: '/fish/angelfish.svg',  w: 160, h: 200, scale: 0.78, type: 'swim'     },
  { src: '/fish/goldfish.svg',   w: 230, h: 150, scale: 1.05, type: 'swim'     },
  { src: '/fish/pufferfish.svg', w: 190, h: 180, scale: 0.72, type: 'swim'     },
  { src: '/fish/neontetra.svg',  w: 200, h: 110, scale: 0.72, type: 'swim'     },
  { src: '/fish/betta.svg',      w: 220, h: 160, scale: 0.88, type: 'swim'     },
  { src: '/fish/jellyfish.svg',  w: 160, h: 200, scale: 0.80, type: 'jellyfish'},
  { src: '/fish/seahorse.svg',   w: 120, h: 220, scale: 0.70, type: 'seahorse' },
]

function loadImages(files) {
  return Promise.all(files.map(f => new Promise(resolve => {
    const img = new Image()
    img.onload  = () => resolve({ img, ...f })
    img.onerror = () => resolve(null)
    img.src = f.src
  })))
}

function spawnCreature(W, H, idx, imgs, forceLeft = false) {
  const info = imgs[idx % imgs.length]
  const displayH = 44 + Math.random() * 24
  const displayW = displayH * (info.w / info.h) * info.scale

  const base = {
    displayW, displayH,
    info,
    bob:    Math.random() * Math.PI * 2,
    wobble: Math.random() * Math.PI * 2,
    phase:  Math.random() * Math.PI * 2,
  }

  if (info.type === 'jellyfish') {
    return {
      ...base,
      x: 60 + Math.random() * (W - 120),
      y: H + displayH,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.18 + Math.random() * 0.22),
      pulsePhase: Math.random() * Math.PI * 2,
    }
  }
  if (info.type === 'seahorse') {
    // seahorse: slow left → right only, random y position
    return {
      ...base,
      x:  -displayW - 10,
      y:  80 + Math.random() * (H - 200),
      vx: 0.10 + Math.random() * 0.15,
      vy: (Math.random() - 0.5) * 0.25,
    }
  }
  // normal fish: always left → right
  // stagger initial x so they don't all start at same spot
  const startX = forceLeft ? -displayW - 10 : -displayW - 10 - Math.random() * W
  return {
    ...base,
    x:  startX,
    y:  60 + Math.random() * (H - 160),
    vx: 0.38 + Math.random() * 0.68,
    vy: (Math.random() - 0.5) * 0.22,
  }
}

// ── Movement tick ─────────────────────────────────────────────────────────
function tickCreature(f, W, H, t, allImgs) {
  const { type } = f.info

  if (type === 'jellyfish') {
    // drift side-to-side, pulse upward
    f.x += f.vx + Math.sin(t * 0.018 + f.phase) * 0.28
    f.y += f.vy + Math.sin(t * 0.04 + f.pulsePhase) * 0.12
    if (f.x < 40)       f.vx =  Math.abs(f.vx)
    if (f.x > W - 40)   f.vx = -Math.abs(f.vx)
    if (f.y + f.displayH < 0) {
      // respawn at bottom
      f.y = H + f.displayH
      f.x = 60 + Math.random() * (W - 120)
    }
    return
  }

  if (type === 'seahorse') {
    // slow drift left → right
    f.x += f.vx
    f.y += f.vy + Math.sin(t * 0.035 + f.bob) * 0.28
    if (f.y < 55)     { f.y = 55;     f.vy =  Math.abs(f.vy) }
    if (f.y > H - 90) { f.y = H - 90; f.vy = -Math.abs(f.vy) }
    if (f.x > W + 80) {
      const sh = allImgs.filter(i => i.type === 'seahorse')
      Object.assign(f, spawnCreature(W, H, 0, sh, true))
    }
    return
  }

  // normal swim — always left → right, loop back from left when off right edge
  f.x += f.vx
  f.y += f.vy + Math.sin(t * 0.02 + f.bob) * 0.14
  if (f.y < 48)     { f.y = 48;     f.vy =  Math.abs(f.vy) }
  if (f.y > H - 75) { f.y = H - 75; f.vy = -Math.abs(f.vy) }
  if (f.x > W + 120) {
    const swimmers = allImgs.filter(i => i.type === 'swim')
    Object.assign(f, spawnCreature(W, H, Math.floor(Math.random() * swimmers.length), swimmers, true))
  }
}

// ── Draw creature ─────────────────────────────────────────────────────────
function drawCreature(ctx, f, t) {
  const { type } = f.info
  ctx.save()
  ctx.translate(f.x, f.y)

  if (type === 'jellyfish') {
    const pulse = 1 + Math.sin(t * 0.05 + f.pulsePhase) * 0.06
    ctx.scale(pulse, 1 / pulse * 0.96)
    ctx.globalAlpha = 0.88
    ctx.drawImage(f.info.img, -f.displayW / 2, -f.displayH / 2, f.displayW, f.displayH)
    ctx.restore()
    return
  }

  if (type === 'seahorse') {
    const sway = Math.sin(t * 0.04 + f.wobble) * 0.05
    ctx.rotate(sway)
    ctx.scale(-1, 1)  // SVG faces left → flip to face right
    ctx.drawImage(f.info.img, -f.displayW / 2, -f.displayH / 2, f.displayW, f.displayH)
    ctx.restore()
    return
  }

  // normal fish — SVGs face left, so flip to face right (direction of travel)
  const tilt = f.vy * 1.5 + Math.sin(t * 0.045 + f.wobble) * 0.04
  ctx.rotate(tilt)
  ctx.scale(-1, 1)   // always mirror: fish faces right = direction of swim
  ctx.drawImage(f.info.img, -f.displayW / 2, -f.displayH / 2, f.displayW, f.displayH)
  ctx.restore()
}

// ── Bokeh ─────────────────────────────────────────────────────────────────
function spawnBokeh(W, H) {
  const colors = ['rgba(255,255,255,','rgba(130,220,255,','rgba(200,240,255,','rgba(255,240,180,','rgba(200,180,255,']
  return {
    x: Math.random() * W,
    y: H * 0.15 + Math.random() * H * 0.85,
    r: 12 + Math.random() * 36,
    vy: -(0.07 + Math.random() * 0.15),
    vx: (Math.random() - 0.5) * 0.1,
    opacity: 0.07 + Math.random() * 0.13,
    color: colors[Math.floor(Math.random() * colors.length)],
    phase: Math.random() * Math.PI * 2,
  }
}

function makeBokehSprite(r, color, opacity) {
  const size = Math.ceil(r * 3)
  const oc = document.createElement('canvas')
  oc.width = size; oc.height = size
  const cx = size / 2, cy = size / 2
  const c = oc.getContext('2d')
  const og = c.createRadialGradient(cx, cy, r * 0.65, cx, cy, r * 1.4)
  og.addColorStop(0, color + '0)'); og.addColorStop(0.55, color + `${opacity * 0.35})`); og.addColorStop(1, color + '0)')
  c.fillStyle = og; c.fillRect(0, 0, size, size)
  const mg = c.createRadialGradient(cx - r * 0.26, cy - r * 0.26, 0, cx, cy, r)
  mg.addColorStop(0, 'rgba(255,255,255,0.88)'); mg.addColorStop(0.28, color + `${opacity * 0.8})`)
  mg.addColorStop(0.72, color + `${opacity * 0.28})`); mg.addColorStop(1, color + '0)')
  c.fillStyle = mg; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill()
  c.fillStyle = 'rgba(255,255,255,0.72)'
  c.beginPath(); c.arc(cx - r * 0.3, cy - r * 0.3, r * 0.2, 0, Math.PI * 2); c.fill()
  return oc
}

// ── Static background ─────────────────────────────────────────────────────
function makeStaticBg(W, H) {
  const oc = document.createElement('canvas')
  oc.width = W; oc.height = H
  const c = oc.getContext('2d')
  const bg = c.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0,    '#e0fffe')
  bg.addColorStop(0.18, '#a8edff')
  bg.addColorStop(0.5,  '#38b6e8')
  bg.addColorStop(0.8,  '#1068ba')
  bg.addColorStop(1,    '#083d7a')
  c.fillStyle = bg; c.fillRect(0, 0, W, H)
  // lens flare
  const lf = c.createRadialGradient(W * 0.66, 0, 0, W * 0.66, 0, W * 0.5)
  lf.addColorStop(0, 'rgba(255,255,255,0.42)')
  lf.addColorStop(0.3,'rgba(200,240,255,0.12)')
  lf.addColorStop(1,  'rgba(255,255,255,0)')
  c.fillStyle = lf; c.fillRect(0, 0, W, H)
  // sand
  const sand = c.createLinearGradient(0, H - 48, 0, H)
  sand.addColorStop(0,'#f5e6b0'); sand.addColorStop(0.5,'#e0c878'); sand.addColorStop(1,'#c09040')
  c.fillStyle = sand
  c.beginPath(); c.moveTo(0, H - 48)
  for (let x = 0; x <= W; x += 55) c.lineTo(x, H - 48 + Math.sin(x * 0.07) * 3)
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill()
  c.globalAlpha = 0.18; c.fillStyle = '#fff'; c.fillRect(0, H - 48, W, 5)
  return oc
}

// ── Static reef ───────────────────────────────────────────────────────────
function makeReef(W, H) {
  const oc = document.createElement('canvas')
  oc.width = W; oc.height = H
  const c = oc.getContext('2d')
  const clusters = [
    { x:148, cols:['#ff4d6d','#ff758f','#ffb3c1'] },
    { x:292, cols:['#48cae4','#00b4d8','#90e0ef'] },
    { x:440, cols:['#f4a261','#e76f51','#ffb347'] },
    { x:590, cols:['#c77dff','#9d4edd','#e0aaff'] },
    { x:770, cols:['#52b788','#40916c','#74c69d'] },
  ]
  clusters.forEach(cl => {
    cl.cols.forEach((col, i) => {
      const tx = cl.x + (i - 1) * 12, th = 22 + i * 9
      const tg = c.createLinearGradient(tx - 7, 0, tx + 7, 0)
      tg.addColorStop(0, col + '88'); tg.addColorStop(0.45, col); tg.addColorStop(1, col + '55')
      c.fillStyle = tg; c.beginPath(); c.roundRect(tx - 7, H - 44 - th, 14, th, [7,7,0,0]); c.fill()
      c.fillStyle = 'rgba(255,255,255,0.32)'; c.beginPath(); c.ellipse(tx, H-44-th, 7, 4, 0, 0, Math.PI*2); c.fill()
      c.fillStyle = 'rgba(0,0,0,0.38)';       c.beginPath(); c.ellipse(tx, H-44-th, 4, 2.5, 0, 0, Math.PI*2); c.fill()
    })
  })
  // brain corals
  ;[{x:82,r:16,col:'#ff85a1'},{x:385,r:13,col:'#ffbe7b'},{x:678,r:18,col:'#a78bfa'}].forEach(bc => {
    const g = c.createRadialGradient(bc.x, H-44-bc.r*0.5, 2, bc.x, H-44, bc.r)
    g.addColorStop(0,'#fff8fa'); g.addColorStop(0.4, bc.col); g.addColorStop(1, bc.col+'88')
    c.fillStyle = g; c.beginPath(); c.arc(bc.x, H-44, bc.r, Math.PI, 0); c.fill()
    c.globalAlpha = 0.22; c.strokeStyle = '#fff'; c.lineWidth = 1
    for (let ri = -bc.r+3; ri < bc.r; ri += 5) {
      const rh = Math.sqrt(Math.max(0, bc.r*bc.r - ri*ri))
      c.beginPath(); c.arc(bc.x+ri*0.22, H-44, rh*0.68, Math.PI, 0); c.stroke()
    }
    c.globalAlpha = 1
  })
  // starfish on sand
  drawStarfish(c, 520, H - 44, 16, '#ff8fab')
  drawStarfish(c, 850, H - 44, 12, '#ffb347')
  // pebbles
  ;[90,195,340,518,648,732,845].forEach((px, i) => {
    const pr = 4 + (i % 3) * 3
    const g = c.createRadialGradient(px-pr*0.3, H-44-pr*0.3, 0, px, H-44, pr)
    g.addColorStop(0,'#fffae8'); g.addColorStop(1,'#c8ad7a')
    c.fillStyle = g; c.beginPath(); c.ellipse(px, H-44, pr, pr*0.55, 0, 0, Math.PI*2); c.fill()
  })
  return oc
}

function drawStarfish(c, cx, cy, r, color) {
  c.save()
  c.translate(cx, cy)
  const grad = c.createRadialGradient(-r*0.2, -r*0.3, 0, 0, 0, r*2)
  grad.addColorStop(0, '#fff0f5'); grad.addColorStop(0.4, color); grad.addColorStop(1, color+'88')
  c.fillStyle = grad
  c.beginPath()
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    i === 0 ? c.moveTo(Math.cos(angle)*radius, Math.sin(angle)*radius)
            : c.lineTo(Math.cos(angle)*radius, Math.sin(angle)*radius)
  }
  c.closePath(); c.fill()
  c.globalAlpha = 0.2; c.fillStyle = '#fff'
  c.beginPath(); c.arc(-r*0.15, -r*0.2, r*0.25, 0, Math.PI*2); c.fill()
  c.restore()
}

// ── Animated light rays ───────────────────────────────────────────────────
function drawRays(ctx, W, H, t) {
  for (let i = 0; i < 4; i++) {
    const rx = W*(0.12+i*0.25) + Math.sin(t*0.006+i*0.9)*18
    const alpha = 0.042 + Math.sin(t*0.01+i*1.3)*0.016
    ctx.beginPath()
    ctx.moveTo(rx-30,0); ctx.lineTo(rx-72,H); ctx.lineTo(rx+72,H); ctx.lineTo(rx+30,0)
    ctx.closePath(); ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fill()
  }
  const sg = ctx.createLinearGradient(0, 0, 0, 34)
  sg.addColorStop(0,'rgba(255,255,255,0.65)'); sg.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 34)
  ctx.globalAlpha = 0.16; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2
  for (let r = 0; r < 3; r++) {
    const ry = 6 + r * 7; ctx.beginPath()
    for (let x = 0; x <= W; x += 40)
      x === 0 ? ctx.moveTo(x, ry) : ctx.lineTo(x, ry + Math.sin(x*0.07 + t*0.016 + r*2)*2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ── Seaweed ───────────────────────────────────────────────────────────────
const PLANTS = [
  {x:38,maxH:80,hue:128},{x:112,maxH:58,hue:142},{x:222,maxH:92,hue:135},
  {x:370,maxH:68,hue:148},{x:490,maxH:98,hue:130},{x:622,maxH:62,hue:140},
  {x:744,maxH:80,hue:138},{x:862,maxH:55,hue:145},
]
function drawSeaweed(ctx, H, t) {
  PLANTS.forEach((pl, pi) => {
    for (let b = 0; b < 3; b++) {
      const bx = pl.x + (b-1)*9
      const bh = pl.maxH * (0.65 + b*0.18)
      const s1 = Math.sin(t*0.022 + pi*0.8 + b*0.5)
      ctx.beginPath(); ctx.moveTo(bx, H-44)
      ctx.bezierCurveTo(bx+s1*6, H-44-bh*0.4, bx+s1*11, H-44-bh*0.75, bx+s1*13, H-44-bh)
      ctx.lineWidth = 4.5-b*0.8; ctx.lineCap = 'round'
      ctx.strokeStyle = `hsla(${pl.hue+b*8},75%,${36+b*8}%,0.88)`; ctx.stroke()
      ctx.beginPath(); ctx.ellipse(bx+s1*13, H-44-bh, 5.5, 2.8, s1*0.4, 0, Math.PI*2)
      ctx.fillStyle = `hsla(${pl.hue+12},85%,52%,0.7)`; ctx.fill()
    }
  })
}

// ── Bubbles ───────────────────────────────────────────────────────────────
function spawnBubble(W, H) {
  return {
    x: 30 + Math.random()*(W-60),
    y: H + 8,
    r: 2 + Math.random()*4,
    vy: -(0.28+Math.random()*0.45),
    wobble: Math.random()*Math.PI*2,
    alpha: 0.35+Math.random()*0.3,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function Aquarium({ totalCommits }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { alpha: false })
    const W = canvas.width, H = canvas.height

    let rafId
    const bgCanvas   = makeStaticBg(W, H)
    const reefCanvas = makeReef(W, H)

    const bokehList = Array.from({ length: 10 }, () => {
      const b = spawnBokeh(W, H)
      b.sprite = makeBokehSprite(b.r, b.color, b.opacity)
      return b
    })
    const bubbles = Array.from({ length: 12 }, () => spawnBubble(W, H))

    loadImages(FISH_FILES).then(imgs => {
      const validImgs = imgs.filter(Boolean)
      const fishCount = Math.max(4, Math.min(14, Math.floor(totalCommits / 30)))

      // ensure at least 1 jellyfish and 1 seahorse
      const jellies   = validImgs.filter(i => i.type === 'jellyfish')
      const seahorses = validImgs.filter(i => i.type === 'seahorse')
      const swimmers  = validImgs.filter(i => i.type === 'swim')

      const creatures = [
        // fish: spread across canvas initially (forceLeft=false → random starting x)
        ...Array.from({ length: fishCount }, (_, i) => spawnCreature(W, H, i, swimmers, false)),
        ...(jellies.length   ? [spawnCreature(W, H, 0, jellies), spawnCreature(W, H, 0, jellies)] : []),
        ...(seahorses.length ? [spawnCreature(W, H, 0, seahorses)]                                : []),
      ]
      // place fish randomly across canvas on init so screen isn't empty
      creatures.forEach(c => {
        if (c.info.type === 'swim') c.x = Math.random() * (W + c.displayW) - c.displayW
        if (c.info.type === 'seahorse') c.x = Math.random() * W
      })

      let t = 0
      const tick = () => {
        ctx.drawImage(bgCanvas, 0, 0)
        drawRays(ctx, W, H, t)

        // bokeh
        bokehList.forEach(o => {
          ctx.drawImage(o.sprite, o.x - o.sprite.width/2, o.y - o.sprite.height/2)
          o.x += o.vx + Math.sin(t*0.012+o.phase)*0.14
          o.y += o.vy
          if (o.y + o.sprite.height/2 < 0) {
            Object.assign(o, spawnBokeh(W, H))
            o.sprite = makeBokehSprite(o.r, o.color, o.opacity)
          }
        })

        drawSeaweed(ctx, H, t)
        ctx.drawImage(reefCanvas, 0, 0)

        // bubbles
        bubbles.forEach(b => {
          b.y += b.vy; b.x += Math.sin(t*0.038+b.wobble)*0.35
          if (b.y+b.r < 0) Object.assign(b, spawnBubble(W, H))
          ctx.globalAlpha = b.alpha
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2)
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.stroke()
          ctx.fillStyle   = 'rgba(200,240,255,0.1)';  ctx.fill()
          ctx.globalAlpha = 1
        })

        // creatures — jellyfish behind fish
        const order = [
          ...creatures.filter(c => c.info.type === 'jellyfish'),
          ...creatures.filter(c => c.info.type !== 'jellyfish'),
        ]
        order.forEach(f => {
          tickCreature(f, W, H, t, validImgs)
          drawCreature(ctx, f, t)
        })

        t++
        rafId = requestAnimationFrame(tick)
      }
      tick()
    })

    return () => cancelAnimationFrame(rafId)
  }, [totalCommits])

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={430}
      style={{ display: 'block', width: '100%' }}
    />
  )
}
