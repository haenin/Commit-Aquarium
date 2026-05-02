import { useEffect, useRef, useState } from 'react'

/* ─────────────── dimensions ─────────────── */
const W = 960, H = 520
const TITLE_H = 28, MENU_H = 22
const SCENE_Y  = TITLE_H + MENU_H
const GRASS_Y  = H - 110
const ZONE_MIN = SCENE_Y + 30
const ZONE_MAX = GRASS_Y  - 20

/* ─────────────── creature catalogue ─────────────── */
// displayW: 화면에 표시될 가로 픽셀 크기 (모두 비슷하게 맞춤)
// flipX: 원본 이미지가 왼쪽을 향하면 true → 오른쪽으로 뒤집어서 표시
// flipX: true = 원본이 왼향 → 미러해서 오른향으로
const CREATURE_DEFS = [
  { key: 'fish1',   displayW: 110, flipX: false },  // 금붕어      (원본 오른향 ✓)
  { key: 'fish2',   displayW: 105, flipX: false },  // 나비고기    (원본 그대로)
  { key: 'fish3',   displayW: 120, flipX: false },  // 엔젤피시    (원본 오른향 ✓)
  { key: 'fish4',   displayW: 115, flipX: true  },  // 빨간금붕어  (원본 왼향 → 뒤집기)
  { key: 'fish5',   displayW: 110, flipX: false },  // 파란물고기  (원본 오른향 ✓)
  { key: 'dolphin', displayW: 108, flipX: false },  // 돌고래      (원본 오른향 ✓)
]

function rnd(a, b) { return a + Math.random() * (b - a) }

/* imgs가 이미 로드된 뒤에 호출해야 naturalHeight를 쓸 수 있음 */
function spawnCreature(idx, imgs) {
  const def = CREATURE_DEFS[idx % CREATURE_DEFS.length]
  const img = imgs[def.key]
  const w   = def.displayW
  // 원본 비율 유지해서 높이 계산
  const h   = img ? Math.round(img.naturalHeight * (w / img.naturalWidth)) : Math.round(w * 0.65)
  return {
    idx,
    key:       def.key,
    flipX:     def.flipX,
    x:         rnd(-240, -60),
    baseY:     rnd(ZONE_MIN, ZONE_MAX),
    y:         0,
    speed:     rnd(0.2, 0.6),
    w, h,
    phase:     rnd(0, Math.PI * 2),
    wobbleAmp: rnd(5, 14),
    wobbleSpd: rnd(0.7, 1.4),
  }
}

/* ─────────────── creature draw ─────────────── */
function drawCreature(ctx, imgs, c) {
  const img = imgs[c.key]
  if (!img) return
  ctx.save()
  if (c.flipX) {
    // 왼향 이미지 → 오른쪽으로 미러
    ctx.translate(c.x + c.w, c.y)
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, -c.h / 2, c.w, c.h)
  } else {
    ctx.drawImage(img, c.x, c.y - c.h / 2, c.w, c.h)
  }
  ctx.restore()
}

/* ─────────────── stars at BOTTOM ─────────────── */
function drawStars(ctx, imgs, t) {
  const defs = [
    { key: 'star1', x: 55,     y: H - 72, s: 0.28 },
    { key: 'star2', x: 180,    y: H - 58, s: 0.25 },
    { key: 'star4', x: W*0.38, y: H - 65, s: 0.22 },
    { key: 'star3', x: W*0.5,  y: H - 70, s: 0.24 },
    { key: 'star1', x: W*0.62, y: H - 62, s: 0.22 },
    { key: 'star2', x: W-180,  y: H - 60, s: 0.25 },
    { key: 'star4', x: W-55,   y: H - 70, s: 0.28 },
  ]
  defs.forEach(({ key, x, y, s }) => {
    const img = imgs[key]
    if (!img) return
    const bob  = Math.sin(t * 0.0018 + x * 0.05) * 4
    const spin = Math.sin(t * 0.0004 + x * 0.03) * 0.28
    const iw   = img.naturalWidth  * s
    const ih   = img.naturalHeight * s
    ctx.save()
    ctx.globalAlpha = 0.82
    ctx.translate(x, y + bob)
    ctx.rotate(spin)
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)
    ctx.restore()
  })
}

/* ─────────────── Windows XP chrome (gradients cached at module level) ─────────────── */
let _cachedCtx = null
let _gradTitle = null, _gradShine = null

function getOrBuildGrads(ctx) {
  if (_cachedCtx === ctx) return
  _cachedCtx = ctx

  _gradTitle = ctx.createLinearGradient(0, 0, 0, TITLE_H)
  _gradTitle.addColorStop(0,    '#62AAEB')
  _gradTitle.addColorStop(0.08, '#458ED8')
  _gradTitle.addColorStop(0.45, '#1B6EC5')
  _gradTitle.addColorStop(0.92, '#1155A0')
  _gradTitle.addColorStop(1,    '#0D4590')

  _gradShine = ctx.createLinearGradient(0, 0, 0, 7)
  _gradShine.addColorStop(0, 'rgba(255,255,255,0.6)')
  _gradShine.addColorStop(1, 'rgba(255,255,255,0)')
}

function drawWindowChrome(ctx) {
  getOrBuildGrads(ctx)
  ctx.save()

  ctx.fillStyle = _gradTitle
  ctx.fillRect(0, 0, W, TITLE_H)

  ctx.fillStyle = _gradShine
  ctx.fillRect(0, 0, W, 7)

  const ix = 8, iy = 6, is = 16, h2 = is / 2 - 1
  ctx.fillStyle = '#E8201A'; ctx.fillRect(ix,      iy,      h2, h2)
  ctx.fillStyle = '#1DAF1A'; ctx.fillRect(ix+h2+1, iy,      h2, h2)
  ctx.fillStyle = '#1A5CE8'; ctx.fillRect(ix,      iy+h2+1, h2, h2)
  ctx.fillStyle = '#F0A400'; ctx.fillRect(ix+h2+1, iy+h2+1, h2, h2)

  ctx.font = 'bold 12px "Segoe UI", Tahoma, Arial, sans-serif'
  ctx.fillStyle = 'white'
  ctx.shadowColor = 'rgba(0,30,80,0.65)'
  ctx.shadowBlur = 2; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1
  ctx.fillText('Untitled - Notepad', ix + is + 8, 18)
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0

  const bH = TITLE_H - 8, bW = 28, bT = 4, bClose = W - bW - 3
  drawWinBtn(ctx, bClose,          bT, bW, bH, '#D84040', '#9E1A1A', '✕')
  drawWinBtn(ctx, bClose - bW-2,   bT, bW, bH, '#4A90D8', '#1A5DB8', '□')
  drawWinBtn(ctx, bClose - bW*2-4, bT, bW, bH, '#4A90D8', '#1A5DB8', '−')

  ctx.fillStyle = '#EDF2F8'
  ctx.fillRect(0, TITLE_H, W, MENU_H)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(0, TITLE_H, W, 1)
  ctx.fillStyle = '#B0C4D8'
  ctx.fillRect(0, TITLE_H + MENU_H - 1, W, 1)

  ctx.font = '12px "Segoe UI", Tahoma, Arial, sans-serif'
  ctx.fillStyle = '#111'
  let mx = 10
  ;['File', 'Edit', 'Search', 'Help'].forEach(label => {
    ctx.fillText(label, mx, TITLE_H + 15)
    mx += ctx.measureText(label).width + 20
  })

  ctx.strokeStyle = '#1050A0'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  ctx.strokeRect(3, 3, W - 6, H - 6)

  ctx.restore()
}

const _btnGradCache = new Map()
function drawWinBtn(ctx, x, y, w, h, colorTop, colorBot, label) {
  const key = `${x},${y},${colorTop}`
  let g = _btnGradCache.get(key)
  if (!g) {
    g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, colorTop); g.addColorStop(1, colorBot)
    _btnGradCache.set(key, g)
  }
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x, y, w, h * 0.48)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, w, h)
  ctx.font = 'bold 11px Arial, sans-serif'; ctx.fillStyle = 'white'
  ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + h * 0.7); ctx.textAlign = 'left'
}

/* ─────────────── main component ─────────────── */
export default function Aquarium({ totalCommits }) {
  const canvasRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let raf, alive = true

    const imgs = {}
    const toLoad = [
      ['bg',        '/assets/commit_bg.jpg'],
      ['fish1',     '/assets/commit_goldfish.png'],
      ['fish2',     '/assets/commit_butterflyfish.png'],
      ['fish3',     '/assets/commit_angelfish.png'],
      ['fish4',     '/assets/commit_redgoldfish.png'],
      ['fish5',     '/assets/commit_bluefish.png'],
      ['dolphin',   '/assets/commit_dolphin.png'],
      ['butterfly', '/assets/commit_butterfly.png'],
      ['bubble',    '/assets/commit_bubble.png'],
      ['star1',     '/assets/commit_star_white.png'],
      ['star2',     '/assets/commit_star_pink.png'],
      ['star3',     '/assets/commit_star_purple.png'],
      ['star4',     '/assets/commit_star_blue.png'],
    ]

    Promise.all(toLoad.map(([k, src]) => new Promise(res => {
      const img = new Image()
      img.onload  = () => { imgs[k] = img; res() }
      img.onerror = res
      img.src     = src
    }))).then(() => {
      if (!alive) return
      if (raf) return  // 이미 루프 중이면 중복 시작 방지
      setLoaded(true)

      // 커밋 수에 따라 생물 수 결정
      const numCreatures = Math.min(4 + Math.floor(totalCommits / 180), 16)
      const creatures = Array.from({ length: numCreatures }, (_, i) => {
        const c = spawnCreature(i, imgs)
        c.x = rnd(0, W)   // 이미 헤엄치고 있는 상태로 시작
        return c
      })

      // 나비 고정 위치 (배경 장식, 움직이지 않음)
      const butterflySpots = [
        { x: 200, y: SCENE_Y + 80,  s: 0.08, phase: 0   },
        { x: 720, y: SCENE_Y + 60,  s: 0.07, phase: 1.5 },
      ]

      // 물방울 orbs (PNG 이미지로 띄워 올림)
      function spawnBubble(i) {
        return {
          x:     rnd(30, W - 30),
          y:     rnd(GRASS_Y, H + 80),
          s:     rnd(0.06, 0.22),        // 표시 크기 (naturalWidth * s)
          speed: rnd(0.18, 0.45),
          phase: i * 1.7,
          alpha: rnd(0.55, 0.90),
        }
      }
      const bubbles = Array.from({ length: 10 }, (_, i) => {
        const b = spawnBubble(i)
        b.y = rnd(SCENE_Y, H)  // 이미 올라오고 있는 상태로 시작
        return b
      })

      function loop(t) {
        // 배경 이미지
        if (imgs['bg']) {
          ctx.drawImage(imgs['bg'], 0, SCENE_Y, W, H - SCENE_Y)
        } else {
          ctx.fillStyle = '#70D8FF'
          ctx.fillRect(0, SCENE_Y, W, H - SCENE_Y)
        }

        // 물방울 — 아래서 위로 떠오름
        const bbl = imgs['bubble']
        if (bbl) {
          bubbles.forEach((b, i) => {
            b.y -= b.speed
            b.x += Math.sin(t * 0.001 + b.phase) * 0.35
            if (b.y < SCENE_Y - bbl.naturalHeight * b.s) Object.assign(b, spawnBubble(i))
            const bw = bbl.naturalWidth  * b.s
            const bh = bbl.naturalHeight * b.s
            ctx.save()
            ctx.globalAlpha = b.alpha
            ctx.drawImage(bbl, b.x - bw / 2, b.y - bh / 2, bw, bh)
            ctx.restore()
          })
        }

        // 나비 — 고정 위치에서 살짝 흔들림만
        const bfImg = imgs['butterfly']
        if (bfImg) {
          butterflySpots.forEach(({ x, y, s, phase }) => {
            const iw  = bfImg.naturalWidth  * s
            const ih  = bfImg.naturalHeight * s
            const bob = Math.sin(t * 0.0015 + phase) * 5
            ctx.save()
            ctx.globalAlpha = 0.88
            ctx.drawImage(bfImg, x - iw / 2, y - ih / 2 + bob, iw, ih)
            ctx.restore()
          })
        }

        // 생물 이동 & 드로우
        creatures.forEach((c, i) => {
          c.x += c.speed
          c.y  = c.baseY + Math.sin(t * 0.001 * c.wobbleSpd + c.phase) * c.wobbleAmp
          if (c.x > W + 200) {
            Object.assign(c, spawnCreature(i, imgs))
            c.x = -200
          }
          drawCreature(ctx, imgs, c)
        })

        // 별 (하단)
        drawStars(ctx, imgs, t)

        // 창틀 (항상 최상단)
        drawWindowChrome(ctx)

        if (alive) raf = requestAnimationFrame(loop)
      }

      raf = requestAnimationFrame(loop)
    })

    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [totalCommits])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a6ea8 0%, #0d3d6b 100%)',
          color: 'white',
          fontSize: '16px',
          gap: '14px',
        }}>
          <div style={{
            width: '40px', height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          어항을 채우는 중...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
