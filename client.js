/* eslint-disable */
/**
 * Browser half of @local/dsh-fuel-rods.
 *
 * A frame-wide, click-through WebGL2 control-rod array with a single-level
 * bloom pass. The renderer is adapted from WebGL2.0-Bloom (MIT); see LICENSE.
 * A hidden composer-dock bridge reads the active Session's token projections
 * and publishes them to the module store consumed by the reactor layer.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-fuel-rods',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NAMESPACE = 'fuel-rods'
    const STORAGE_KEY = 'dsh-fuel-rods.prefs.v2'
    const LEGACY_STORAGE_KEY = 'dsh-fuel-rods.prefs.v1'
    const NO_VALUE = '\u2014'
    const DEFAULT_PREFS = Object.freeze({
      token: true,
      cache: true,
      output: true,
      context: true,
      strength: 0.6,
      sensitivity: 1.4,
      smoothing: 75,
      backdrop: 'black',
      sidebarSync: false,
    })
    const METRICS = [
      { key: 'token', color: '#e6ba76' },
      { key: 'cache', color: '#c5d185' },
      { key: 'output', color: '#a9c9e8' },
      { key: 'context', color: '#99b4a9' },
    ]
    const BACKDROPS = [
      {
        key: 'black',
        swatch: 'radial-gradient(ellipse at 50% 49%, #1d221e 0%, #0f1310 43%, #050706 78%)',
        stops: ['rgba(29, 34, 30, 0.28)', 'rgba(15, 19, 16, 0.32)', 'rgba(5, 7, 6, 0.40)'],
      },
      {
        key: 'reference',
        swatch: 'radial-gradient(ellipse at 50% 49%, #2f5a45 0%, #1b3b2d 43%, #0b1f17 78%)',
        stops: ['rgba(47, 90, 69, 0.32)', 'rgba(27, 59, 45, 0.36)', 'rgba(11, 31, 23, 0.44)'],
      },
      {
        key: 'brick',
        swatch: 'radial-gradient(ellipse at 50% 49%, #8a543e 0%, #5a3425 43%, #291710 78%)',
        stops: ['rgba(138, 84, 62, 0.26)', 'rgba(90, 52, 37, 0.30)', 'rgba(28, 15, 11, 0.38)'],
      },
      {
        key: 'beige',
        swatch: 'radial-gradient(ellipse at 50% 49%, #d8c4a0 0%, #b39b73 43%, #705f45 78%)',
        stops: ['rgba(216, 196, 160, 0.17)', 'rgba(179, 155, 115, 0.21)', 'rgba(86, 72, 52, 0.29)'],
      },
    ]
    const BACKDROP_BY_KEY = Object.fromEntries(BACKDROPS.map((item) => [item.key, item]))

    /*
     * DeepSeek official list prices, per 1M tokens, checked 2026-10-18 against
     * https://api-docs.deepseek.com/zh-cn/quick_start/pricing/ (CNY) and
     * https://api-docs.deepseek.com/quick_start/pricing (USD).
     * Peak: Beijing Mon-Fri 09:00-12:00 and 14:00-18:00, excluding PRC holidays.
     * Cache writes are billed at the cache-miss input rate.
     */
    const COST_PROVIDERS = new Set(['deepseek-official', 'deepseek-account'])
    const COST_MODEL_ALIASES = {
      'deepseek-v4-flash': 'deepseek-flash',
      'deepseek-v4-flash-vision-exp': 'deepseek-flash',
    }
    const COST_RATES = {
      'deepseek-flash': {
        CNY: {
          peak: { hit: 0.04, miss: 2, output: 8 },
          offPeak: { hit: 0.02, miss: 1, output: 4 },
        },
        USD: {
          peak: { hit: 0.006, miss: 0.3, output: 1.2 },
          offPeak: { hit: 0.003, miss: 0.15, output: 0.6 },
        },
      },
      'deepseek-v4-pro': {
        CNY: {
          peak: { hit: 0.3, miss: 9, output: 27 },
          offPeak: { hit: 0.15, miss: 4.5, output: 13.5 },
        },
        USD: {
          peak: { hit: 0.044, miss: 1.32, output: 3.96 },
          offPeak: { hit: 0.022, miss: 0.66, output: 1.98 },
        },
      },
    }

    const DICTIONARIES = {
      zh: {
        group: '核燃料棒背景指标',
        running: '运行中',
        idle: '待机',
        'metric.token': 'Token 用量',
        'metric.cache': '缓存命中',
        'metric.output': 'Token 输出速度',
        'metric.context': '上下文占用',
        on: '参与背景',
        off: '不参与背景',
        'hint.token': '当前会话累计 Token 用量，控制堆芯振幅与冲击波。',
        'hint.cache': '缓存命中占输入 Token 的比例，控制波动节奏。',
        'hint.output': '按 output Token 增量估算的输出速度，控制棒顶高频闪烁。',
        'hint.context': '下一次请求预计占用 / 上下文窗口，控制基础高度与辉光。',
        'unit.tokPerSec': 'tok/s',
        'settings.trigger': '反应堆设置',
        'settings.title': '反应堆设置',
        'settings.subtitle': 'REACTOR · BLOOM',
        'settings.metrics': '驱动指标',
        'settings.background': '全局背景',
        'settings.sidebarSync': '侧边栏同步',
        'settings.sidebarSyncHint': '全局背景同步至侧边栏',
        'background.black': '黑色',
        'background.reference': '松绿',
        'background.brick': '砖红',
        'background.beige': '米黄',
        'settings.display': '显示',
        'settings.strength': '反应堆透明度',
        'settings.sensitivity': '控制棒灵敏度',
        'settings.smoothing': '运动平滑度',
        'settings.cost': '会话开销',
        'settings.costNoUsage': '暂无用量。',
        'settings.costUnknown': '当前模型没有公开价格。',
        'settings.costEstimate': '按当前时段官方价估算，实际以平台账单为准',
        'settings.peak': '高峰',
        'settings.offPeak': '空闲',
        'settings.reset': '恢复默认',
        'settings.close': '关闭',
        'settings.footnote': '数据仅来自当前会话投影，不读取对话内容。',
        'mode.fallback': '静态降级',
      },
      en: {
        group: 'Fuel rod background metrics',
        running: 'Running',
        idle: 'Idle',
        'metric.token': 'Token usage',
        'metric.cache': 'Cache hit',
        'metric.output': 'Output speed',
        'metric.context': 'Context',
        on: 'in background',
        off: 'not in background',
        'hint.token': 'Session token usage drives amplitude and shockwaves.',
        'hint.cache': 'Cache-hit share of input tokens drives the tempo.',
        'hint.output': 'Estimated output tokens per second drives high-frequency flicker.',
        'hint.context': 'Projected occupancy drives baseline height and glow.',
        'unit.tokPerSec': 'tok/s',
        'settings.trigger': 'Reactor settings',
        'settings.title': 'Reactor settings',
        'settings.subtitle': 'REACTOR · BLOOM',
        'settings.metrics': 'DRIVERS',
        'settings.background': 'GLOBAL BACKGROUND',
        'settings.sidebarSync': 'Sidebar sync',
        'settings.sidebarSyncHint': 'Sync the global background to the sidebars',
        'background.black': 'Black',
        'background.reference': 'Pine',
        'background.brick': 'Brick',
        'background.beige': 'Beige',
        'settings.display': 'DISPLAY',
        'settings.strength': 'Reactor opacity',
        'settings.sensitivity': 'Rod sensitivity',
        'settings.smoothing': 'Motion smoothing',
        'settings.cost': 'Session cost',
        'settings.costNoUsage': 'No usage yet.',
        'settings.costUnknown': 'No public rate for this model.',
        'settings.costEstimate': 'Estimated at current official rates; platform billing prevails',
        'settings.peak': 'peak',
        'settings.offPeak': 'off-peak',
        'settings.reset': 'Reset',
        'settings.close': 'Close',
        'settings.footnote': 'Reads session projections only; never the conversation.',
        'mode.fallback': 'STATIC FALLBACK',
      },
    }

    function clamp(value, min = 0, max = 1) {
      return Math.min(max, Math.max(min, value))
    }

    function isFiniteNumber(value) {
      return typeof value === 'number' && Number.isFinite(value)
    }

    function count(value) {
      return isFiniteNumber(value) && value > 0 ? value : 0
    }

    function formatTokens(value) {
      if (!isFiniteNumber(value) || value < 0) return NO_VALUE
      if (value < 1000) return String(Math.round(value))
      const scaled = value < 1000000 ? value / 1000 : value / 1000000
      const unit = value < 1000000 ? 'k' : 'M'
      return (scaled >= 100
        ? String(Math.round(scaled))
        : String(Math.round(scaled * 10) / 10)) + unit
    }

    function formatPercent(ratio) {
      if (!isFiniteNumber(ratio)) return NO_VALUE
      return Math.round(clamp(ratio) * 100) + '%'
    }

    function formatSpeed(value, unit) {
      if (!isFiniteNumber(value) || value < 0) return NO_VALUE
      const rounded = value >= 10
        ? String(Math.round(value))
        : String(Math.round(value * 10) / 10)
      return `${rounded} ${unit}`
    }

    function isPeakCostTime(now = new Date()) {
      const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000)
      const day = beijing.getUTCDay()
      if (day === 0 || day === 6) return false
      const minutes = beijing.getUTCHours() * 60 + beijing.getUTCMinutes()
      return (minutes >= 9 * 60 && minutes < 12 * 60)
        || (minutes >= 14 * 60 && minutes < 18 * 60)
    }

    function resolveCostRates(provider, model, currency) {
      if (typeof provider !== 'string' || !COST_PROVIDERS.has(provider)) return null
      if (typeof model !== 'string' || model === '') return null
      const key = COST_MODEL_ALIASES[model] ?? model
      return COST_RATES[key]?.[currency] ?? null
    }

    function estimateSessionCost(snapshot, currency, peak) {
      const rates = resolveCostRates(snapshot.modelProvider, snapshot.modelId, currency)
      if (rates === null) return null
      const buckets = [
        snapshot.uncachedInputTokens,
        snapshot.cacheReadTokens,
        snapshot.cacheWriteTokens,
        snapshot.outputTokens,
      ]
      if (!buckets.every(isFiniteNumber)) return null
      const price = peak ? rates.peak : rates.offPeak
      return (
        snapshot.uncachedInputTokens * price.miss
        + snapshot.cacheReadTokens * price.hit
        + snapshot.cacheWriteTokens * price.miss
        + snapshot.outputTokens * price.output
      ) / 1000000
    }

    function formatCost(value, currency) {
      if (!isFiniteNumber(value)) return NO_VALUE
      const symbol = currency === 'CNY' ? '¥' : '$'
      const magnitude = Math.abs(value)
      const digits = magnitude < 0.0001 ? 5 : magnitude < 0.01 ? 4 : magnitude < 1 ? 3 : 2
      return symbol + value.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    }

    function readPrefs() {
      let parsed = null
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        parsed = raw === null ? null : JSON.parse(raw)
      } catch {
        parsed = null
      }
      if (parsed === null) {
        try {
          const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
          parsed = legacy === null ? null : JSON.parse(legacy)
        } catch {
          parsed = null
        }
      }
      const source = parsed !== null && typeof parsed === 'object' ? parsed : {}
      return {
        token: source.token !== false,
        cache: source.cache !== false,
        output: source.output !== false,
        context: source.context !== false,
        strength: isFiniteNumber(source.strength)
          ? clamp(source.strength, 0, 1)
          : DEFAULT_PREFS.strength,
        sensitivity: isFiniteNumber(source.sensitivity)
          ? clamp(source.sensitivity, 0.3, 3)
          : DEFAULT_PREFS.sensitivity,
        smoothing: isFiniteNumber(source.smoothing)
          ? clamp(source.smoothing, 0, 95)
          : DEFAULT_PREFS.smoothing,
        backdrop: typeof source.backdrop === 'string' && BACKDROP_BY_KEY[source.backdrop]
          ? source.backdrop
          : DEFAULT_PREFS.backdrop,
        sidebarSync: source.sidebarSync === true,
      }
    }

    function writePrefs(prefs) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      } catch {
        /* A blocked storage must never break the decoration. */
      }
    }

    let store = {
      sessionId: null,
      running: false,
      tokenTotal: null,
      cacheRatio: null,
      contextRatio: null,
      outputSpeed: null,
      uncachedInputTokens: null,
      cacheReadTokens: null,
      cacheWriteTokens: null,
      outputTokens: null,
      modelProvider: null,
      modelId: null,
      stageWidth: null,
      stageCenterX: null,
      pulse: 0,
      prefs: readPrefs(),
    }
    const listeners = new Set()

    function subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    function emit(patch) {
      store = { ...store, ...patch }
      for (const listener of Array.from(listeners)) listener(store)
    }

    function setPrefs(patch) {
      const next = { ...store.prefs, ...patch }
      if (isFiniteNumber(next.strength)) next.strength = clamp(next.strength, 0, 1)
      if (isFiniteNumber(next.sensitivity)) next.sensitivity = clamp(next.sensitivity, 0.3, 3)
      if (isFiniteNumber(next.smoothing)) next.smoothing = clamp(next.smoothing, 0, 95)
      writePrefs(next)
      emit({ prefs: next })
    }

    function clearSession(sessionId) {
      if (store.sessionId !== sessionId) return
      emit({
        sessionId: null,
        running: false,
        tokenTotal: null,
        cacheRatio: null,
        contextRatio: null,
        outputSpeed: null,
        uncachedInputTokens: null,
        cacheReadTokens: null,
        cacheWriteTokens: null,
        outputTokens: null,
        modelProvider: null,
        modelId: null,
        stageWidth: null,
        stageCenterX: null,
      })
    }

    function useStore() {
      const [snapshot, setSnapshot] = React.useState(store)
      React.useEffect(() => {
        const unsubscribe = subscribe(setSnapshot)
        setSnapshot(store)
        return unsubscribe
      }, [])
      return snapshot
    }

    function useT(locale) {
      const [, bump] = React.useReducer((revision) => revision + 1, 0)
      React.useEffect(() => locale.subscribe(bump), [locale])
      return React.useMemo(() => locale.bind(NAMESPACE), [locale])
    }

    /* ------------------------------------------------------------------ */
    /* Hidden Session bridge                                               */
    /* ------------------------------------------------------------------ */

    function FuelBridge(props) {
      const usage = props.useProjection('tokenUsage')
      const pressure = props.useProjection('contextPressure')
      const modelSelection = props.useProjection('modelSelection')
      const running = props.useSession((session) => session?.running) === true
      const sessionId = props.sessionId
      const hasUsage = usage != null
      const selectedModel = modelSelection?.lastUsed ?? modelSelection?.next ?? null
      const modelProvider = typeof selectedModel?.provider === 'string' ? selectedModel.provider : null
      const modelId = typeof selectedModel?.model === 'string' ? selectedModel.model : null

      const uncached = usage == null ? 0 : count(usage.uncachedInputTokens)
      const cacheRead = usage == null ? 0 : count(usage.cacheReadTokens)
      const cacheWrite = usage == null ? 0 : count(usage.cacheWriteTokens)
      const output = usage == null ? 0 : count(usage.outputTokens)
      const tokenTotal = usage == null ? null : uncached + cacheRead + cacheWrite + output
      const promptTotal = uncached + cacheRead + cacheWrite
      const cacheRatio = usage != null && promptTotal > 0
        ? clamp(cacheRead / promptTotal)
        : null
      const usedTokens = pressure == null
        ? undefined
        : pressure.projectedTokens ?? pressure.pressureTokens
      const contextRatio = isFiniteNumber(usedTokens)
        && isFiniteNumber(pressure?.contextWindow)
        && pressure.contextWindow > 0
        ? clamp(usedTokens / pressure.contextWindow)
        : null

      const previousToken = React.useRef(null)
      const pulse = React.useRef(0)
      const previousOutput = React.useRef(null)
      const outputAt = React.useRef(0)
      const outputSpeed = React.useRef(0)

      React.useEffect(() => {
        previousToken.current = null
        pulse.current = 0
        previousOutput.current = null
        outputAt.current = 0
        outputSpeed.current = 0
      }, [sessionId])

      React.useEffect(() => {
        if (!hasUsage) {
          outputSpeed.current = 0
          emit({ outputSpeed: null })
          return undefined
        }
        const id = window.setInterval(() => {
          if (outputSpeed.current <= 0) return
          outputSpeed.current *= 0.58
          if (outputSpeed.current < 0.1) outputSpeed.current = 0
          emit({ outputSpeed: outputSpeed.current })
        }, 1000)
        return () => window.clearInterval(id)
      }, [hasUsage])

      React.useEffect(() => {
        if (
          tokenTotal !== null
          && previousToken.current !== null
          && tokenTotal > previousToken.current
          && running
        ) {
          pulse.current += 1
        }
        previousToken.current = tokenTotal

        const now = performance.now()
        if (!hasUsage) {
          previousOutput.current = null
          outputAt.current = 0
          outputSpeed.current = 0
        } else if (previousOutput.current === null) {
          previousOutput.current = output
          outputAt.current = now
        } else if (output > previousOutput.current) {
          const elapsed = Math.max(0.15, (now - outputAt.current) / 1000)
          const instantaneous = Math.min(400, (output - previousOutput.current) / elapsed)
          outputSpeed.current = outputSpeed.current > 0
            ? outputSpeed.current * 0.55 + instantaneous * 0.45
            : instantaneous
          previousOutput.current = output
          outputAt.current = now
        } else if (output < previousOutput.current) {
          previousOutput.current = output
          outputAt.current = now
        }

        emit({
          sessionId,
          running,
          tokenTotal,
          cacheRatio,
          contextRatio,
          outputSpeed: hasUsage ? outputSpeed.current : null,
          pulse: pulse.current,
          uncachedInputTokens: usage == null ? null : uncached,
          cacheReadTokens: usage == null ? null : cacheRead,
          cacheWriteTokens: usage == null ? null : cacheWrite,
          outputTokens: usage == null ? null : output,
          modelProvider,
          modelId,
        })
      }, [
        sessionId,
        running,
        tokenTotal,
        cacheRatio,
        contextRatio,
        output,
        hasUsage,
        uncached,
        cacheRead,
        cacheWrite,
        modelProvider,
        modelId,
      ])

      React.useEffect(() => {
        let raf = 0
        let timer = 0
        let observer = null
        let observed = null
        let lastWidth = null
        let lastCenter = null
        let disposed = false

        const findStage = () => {
          if (typeof document === 'undefined') return null
          const candidates = Array.from(document.querySelectorAll('[data-conversation-scroll]'))
          let best = null
          let bestArea = 0
          for (const candidate of candidates) {
            const rect = candidate.getBoundingClientRect()
            if (rect.width < 1 || rect.height < 1) continue
            const style = window.getComputedStyle(candidate)
            if (style.display === 'none' || style.visibility === 'hidden') continue
            const area = rect.width * rect.height
            if (area > bestArea) {
              bestArea = area
              best = candidate
            }
          }
          return best
        }

        const measure = () => {
          raf = 0
          if (disposed) return
          const element = findStage()
          if (element === null) {
            if (lastWidth !== null) {
              lastWidth = null
              lastCenter = null
              emit({ stageWidth: null, stageCenterX: null })
            }
            return
          }
          const rect = element.getBoundingClientRect()
          if (rect.width < 1) return
          const center = rect.left + rect.width / 2
          if (
            lastWidth === null
            || lastCenter === null
            || Math.abs(rect.width - lastWidth) > 0.5
            || Math.abs(center - lastCenter) > 0.5
          ) {
            lastWidth = rect.width
            lastCenter = center
            emit({ stageWidth: rect.width, stageCenterX: center })
          }
          if (observed !== element) {
            if (observer !== null) observer.disconnect()
            observed = element
            if (typeof ResizeObserver === 'function') {
              observer = new ResizeObserver(schedule)
              observer.observe(element)
            }
          }
        }

        const schedule = () => {
          if (raf === 0) raf = requestAnimationFrame(measure)
        }
        const onResize = () => schedule()
        schedule()
        timer = window.setTimeout(schedule, 250)
        window.addEventListener('resize', onResize)
        return () => {
          disposed = true
          if (raf !== 0) cancelAnimationFrame(raf)
          if (timer !== 0) window.clearTimeout(timer)
          if (observer !== null) observer.disconnect()
          window.removeEventListener('resize', onResize)
        }
      }, [sessionId])

      React.useEffect(() => () => clearSession(sessionId), [sessionId])
      return null
    }

    /* ------------------------------------------------------------------ */
    /* WebGL2 reactor                                                      */
    /* ------------------------------------------------------------------ */

    const RODS = []
    for (let x = -15; x <= 15; x += 1) {
      for (let z = -15; z <= 15; z += 1) {
        const r = Math.hypot(x, z)
        if (r <= 15) {
          RODS.push({
            x,
            z,
            r,
            seed: Math.abs(Math.sin(x * 127.1 + z * 311.7)),
            h: 0.18 + Math.abs(Math.sin(x * 31.7 + z * 19.3)) * 0.32,
            amp: 0,
          })
        }
      }
    }

    const MAX_VERTS = 160000
    const PALETTE = {
      ringOuterDark: '#060b07',
      ringMain: '#505948',
      ringInner: '#878969',
      ringOuter: '#303a2d',
      tickA: '#484d31',
      tickB: '#adac64',
      side1: [66, 72, 56],
      side3: [51, 60, 43],
      side4: [57, 67, 47],
      sideEdge: [17, 25, 16],
      topEdge: [35, 45, 32],
      rodDot: [64, 71, 53],
      edge: [13, 20, 9],
    }

    const VS_MAIN = `#version 300 es
in vec3 aPos;
in vec3 aColor;
out vec3 vColor;
void main(){
  vColor = aColor;
  gl_Position = vec4(aPos, 1.0);
}`

    const FS_MAIN = `#version 300 es
precision mediump float;
in vec3 vColor;
out vec4 fragColor;
void main(){
  fragColor = vec4(vColor, 1.0);
}`

    const VS_QUAD = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main(){
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

    const FS_BRIGHT = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uScene;
uniform float uThreshold;
out vec4 fragColor;
void main(){
  vec4 s = texture(uScene, vUV);
  vec3 c = s.rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float d = max(lum, 0.0001);
  float f = max(lum - uThreshold, 0.0) / d;
  fragColor = vec4(c * f, 1.0);
}`

    const FS_BLUR = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uTexture;
uniform vec2 uDirection;
out vec4 fragColor;
void main(){
  float w0 = 0.227027, w1 = 0.1945946, w2 = 0.1216216, w3 = 0.054054, w4 = 0.016216;
  vec3 result = texture(uTexture, vUV).rgb * w0;
  vec2 o1 = uDirection * 1.0;
  vec2 o2 = uDirection * 2.0;
  vec2 o3 = uDirection * 3.0;
  vec2 o4 = uDirection * 4.0;
  result += texture(uTexture, vUV + o1).rgb * w1;
  result += texture(uTexture, vUV - o1).rgb * w1;
  result += texture(uTexture, vUV + o2).rgb * w2;
  result += texture(uTexture, vUV - o2).rgb * w2;
  result += texture(uTexture, vUV + o3).rgb * w3;
  result += texture(uTexture, vUV - o3).rgb * w3;
  result += texture(uTexture, vUV + o4).rgb * w4;
  result += texture(uTexture, vUV - o4).rgb * w4;
  fragColor = vec4(result, 1.0);
}`

    const FS_COMPOSITE = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uIntensity;
out vec4 fragColor;
void main(){
  vec4 scene = texture(uScene, vUV);
  vec3 bloom = texture(uBloom, vUV).rgb;
  bloom *= scene.a;
  vec3 color = scene.rgb + bloom * uIntensity;
  float maxC = max(max(color.r, color.g), color.b);
  color *= (1.0 - smoothstep(1.0, 1.6, maxC) * 0.4);
  fragColor = vec4(color, scene.a);
}`

    function hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16)
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }

    function rgb(r, g, b) {
      return [r / 255, g / 255, b / 255]
    }

    function compileProgram(gl, vsSource, fsSource, label) {
      const vs = gl.createShader(gl.VERTEX_SHADER)
      const fs = gl.createShader(gl.FRAGMENT_SHADER)
      const program = gl.createProgram()
      try {
        gl.shaderSource(vs, vsSource)
        gl.compileShader(vs)
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
          throw new Error(`${label} vertex shader: ${gl.getShaderInfoLog(vs)}`)
        }
        gl.shaderSource(fs, fsSource)
        gl.compileShader(fs)
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
          throw new Error(`${label} fragment shader: ${gl.getShaderInfoLog(fs)}`)
        }
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(`${label} link: ${gl.getProgramInfoLog(program)}`)
        }
        return program
      } catch (error) {
        gl.deleteProgram(program)
        gl.deleteShader(vs)
        gl.deleteShader(fs)
        throw error
      }
    }

    function createFBO(gl, width, height) {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteFramebuffer(fbo)
        gl.deleteTexture(tex)
        throw new Error(`Bloom framebuffer incomplete: 0x${status.toString(16)}`)
      }
      return { fbo, tex, width, height }
    }

    function destroyFBO(gl, fbo) {
      if (fbo === null) return
      gl.deleteFramebuffer(fbo.fbo)
      gl.deleteTexture(fbo.tex)
    }

    function createBloom(gl) {
      let width = 1
      let height = 1
      let fboScene = null
      let fboBright = null
      let fboBlur = null
      let quadBuf = null
      let bright = null
      let blur = null
      let composite = null
      let threshold = 0.45
      let intensity = 1.3
      let radius = 1.5
      let disposed = false

      function drawQuad(program) {
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
        gl.enableVertexAttribArray(program.aPos)
        gl.vertexAttribPointer(program.aPos, 2, gl.FLOAT, false, 0, 0)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        gl.disableVertexAttribArray(program.aPos)
      }

      function bindTex(tex, unit) {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, tex)
      }

      function init() {
        bright = {
          program: compileProgram(gl, VS_QUAD, FS_BRIGHT, 'bloom bright'),
          aPos: 0,
          uScene: null,
          uThreshold: null,
        }
        blur = {
          program: compileProgram(gl, VS_QUAD, FS_BLUR, 'bloom blur'),
          aPos: 0,
          uTexture: null,
          uDirection: null,
        }
        composite = {
          program: compileProgram(gl, VS_QUAD, FS_COMPOSITE, 'bloom composite'),
          aPos: 0,
          uScene: null,
          uBloom: null,
          uIntensity: null,
        }
        quadBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1, 1, -1, -1, 1,
          -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW)
        for (const [name, p] of Object.entries({ bright, blur, composite })) {
          p.aPos = gl.getAttribLocation(p.program, 'aPos')
          if (name === 'bright') {
            p.uScene = gl.getUniformLocation(p.program, 'uScene')
            p.uThreshold = gl.getUniformLocation(p.program, 'uThreshold')
          } else if (name === 'blur') {
            p.uTexture = gl.getUniformLocation(p.program, 'uTexture')
            p.uDirection = gl.getUniformLocation(p.program, 'uDirection')
          } else {
            p.uScene = gl.getUniformLocation(p.program, 'uScene')
            p.uBloom = gl.getUniformLocation(p.program, 'uBloom')
            p.uIntensity = gl.getUniformLocation(p.program, 'uIntensity')
          }
        }
      }

      function resize(nextWidth, nextHeight) {
        width = Math.max(1, Math.floor(nextWidth))
        height = Math.max(1, Math.floor(nextHeight))
        destroyFBO(gl, fboScene)
        destroyFBO(gl, fboBright)
        destroyFBO(gl, fboBlur)
        fboScene = null
        fboBright = null
        fboBlur = null
        const ss = Math.min(1.5, Math.sqrt(5000000 / (width * height)))
        fboScene = createFBO(gl, Math.max(1, Math.round(width * ss)), Math.max(1, Math.round(height * ss)))
        const bw = Math.max(1, Math.floor(width / 2))
        const bh = Math.max(1, Math.floor(height / 2))
        fboBright = createFBO(gl, bw, bh)
        fboBlur = createFBO(gl, bw, bh)
      }

      function beginScene() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboScene.fbo)
        gl.viewport(0, 0, fboScene.width, fboScene.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }

      function endScene() {
        const bw = fboBright.width
        const bh = fboBright.height
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboBright.fbo)
        gl.viewport(0, 0, bw, bh)
        gl.useProgram(bright.program)
        bindTex(fboScene.tex, 0)
        gl.uniform1i(bright.uScene, 0)
        gl.uniform1f(bright.uThreshold, threshold)
        drawQuad(bright)

        gl.bindFramebuffer(gl.FRAMEBUFFER, fboBlur.fbo)
        gl.viewport(0, 0, bw, bh)
        gl.useProgram(blur.program)
        bindTex(fboBright.tex, 0)
        gl.uniform1i(blur.uTexture, 0)
        gl.uniform2f(blur.uDirection, radius / bw, 0)
        drawQuad(blur)

        gl.bindFramebuffer(gl.FRAMEBUFFER, fboBright.fbo)
        gl.viewport(0, 0, bw, bh)
        bindTex(fboBlur.tex, 0)
        gl.uniform1i(blur.uTexture, 0)
        gl.uniform2f(blur.uDirection, 0, radius / bh)
        drawQuad(blur)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, width, height)
        gl.useProgram(composite.program)
        bindTex(fboScene.tex, 0)
        bindTex(fboBright.tex, 1)
        gl.uniform1i(composite.uScene, 0)
        gl.uniform1i(composite.uBloom, 1)
        gl.uniform1f(composite.uIntensity, intensity)
        drawQuad(composite)
      }

      function setParams(params) {
        if (isFiniteNumber(params.threshold)) threshold = params.threshold
        if (isFiniteNumber(params.intensity)) intensity = params.intensity
        if (isFiniteNumber(params.radius)) radius = params.radius
      }

      function dispose() {
        if (disposed) return
        disposed = true
        destroyFBO(gl, fboScene)
        destroyFBO(gl, fboBright)
        destroyFBO(gl, fboBlur)
        if (quadBuf !== null) gl.deleteBuffer(quadBuf)
        for (const p of [bright, blur, composite]) {
          if (p !== null) gl.deleteProgram(p.program)
        }
      }

      return { init, resize, beginScene, endScene, setParams, dispose }
    }

    function createReactorRenderer(canvas, options = {}) {
      const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      })
      if (gl === null) throw new Error('WebGL2 is unavailable')

      let disposed = false
      let failed = false
      let rafId = 0
      let running = false
      let hidden = document.visibilityState === 'hidden'
      let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let prefs = { ...DEFAULT_PREFS }
      let tokenN = 0.3
      let cacheN = 0.3
      let outputN = 0.3
      let contextN = 0.3
      let pulse = 0
      let lastPulse = 0
      let pulseAt = -1e9
      let simTime = 0
      let lastNow = 0
      let lastDraw = 0
      let viewW = 1
      let viewH = 1
      let stageTargetW = null
      let stageTargetCX = null
      let stageW = 1
      let stageCX = 1
      let angle = -0.32
      let tilt = 0.58
      let zoom = 1
      let mainProgram = null
      let mainProgramInfo = null
      let vbo = null
      let bloom = null
      let resizeObserver = null
      let resizeRaf = 0
      let motionQuery = null
      let vertexData = new Float32Array(MAX_VERTS * 6)
      let vp = 0

      const C = {
        ringOuterDark: hexToRgb(PALETTE.ringOuterDark),
        ringMain: hexToRgb(PALETTE.ringMain),
        ringInner: hexToRgb(PALETTE.ringInner),
        ringOuter: hexToRgb(PALETTE.ringOuter),
        tickA: hexToRgb(PALETTE.tickA),
        tickB: hexToRgb(PALETTE.tickB),
        side1: rgb(...PALETTE.side1),
        side3: rgb(...PALETTE.side3),
        side4: rgb(...PALETTE.side4),
        sideEdge: rgb(...PALETTE.sideEdge),
        topEdge: rgb(...PALETTE.topEdge),
        rodDot: rgb(...PALETTE.rodDot),
        edge: rgb(...PALETTE.edge),
      }

      function stageTargets() {
        return {
          width: stageTargetW === null ? viewW : Math.min(stageTargetW, viewW),
          center: stageTargetCX === null ? viewW / 2 : clamp(stageTargetCX, 0, viewW),
        }
      }

      function snapStage() {
        const targets = stageTargets()
        stageW = targets.width
        stageCX = targets.center
      }

      function reactorScale() {
        const widthFit = stageW / 45
        const heightFit = viewH / 28
        const widthBias = 0.8 + 0.2 * clamp(stageW / Math.max(1, viewW), 0, 1)
        return Math.min(widthFit, heightFit) * widthBias * zoom
      }

      function project(x, z, height) {
        const scale = reactorScale()
        const ca = Math.cos(angle)
        const sa = Math.sin(angle)
        const rx = x * ca - z * sa
        const rz = x * sa + z * ca
        return [
          stageCX + rx * scale,
          viewH * 0.55 + rz * scale * tilt - height * scale,
        ]
      }

      function toClip(px, py) {
        return [
          (px / viewW) * 2 - 1,
          1 - (py / viewH) * 2,
        ]
      }

      function pushVertex(px, py, color) {
        if (vp + 6 > vertexData.length) return
        const c = toClip(px, py)
        vertexData[vp++] = c[0]
        vertexData[vp++] = c[1]
        vertexData[vp++] = 0
        vertexData[vp++] = color[0]
        vertexData[vp++] = color[1]
        vertexData[vp++] = color[2]
      }

      function pushEdge(p1, p2, color, edgeWidth) {
        const dx = p2[0] - p1[0]
        const dy = p2[1] - p1[1]
        const length = Math.hypot(dx, dy) || 1
        const nx = -dy / length * edgeWidth * 0.5
        const ny = dx / length * edgeWidth * 0.5
        pushVertex(p1[0] + nx, p1[1] + ny, color)
        pushVertex(p2[0] + nx, p2[1] + ny, color)
        pushVertex(p2[0] - nx, p2[1] - ny, color)
        pushVertex(p1[0] + nx, p1[1] + ny, color)
        pushVertex(p2[0] - nx, p2[1] - ny, color)
        pushVertex(p1[0] - nx, p1[1] - ny, color)
      }

      function pushQuad(p1, p2, p3, p4, color) {
        pushVertex(p1[0], p1[1], color)
        pushVertex(p2[0], p2[1], color)
        pushVertex(p3[0], p3[1], color)
        pushVertex(p1[0], p1[1], color)
        pushVertex(p3[0], p3[1], color)
        pushVertex(p4[0], p4[1], color)
      }

      function pushDisc(cx, cy, rx, ry, color, segments = 12) {
        for (let i = 0; i < segments; i += 1) {
          const a0 = i / segments * Math.PI * 2
          const a1 = (i + 1) / segments * Math.PI * 2
          pushVertex(cx, cy, color)
          pushVertex(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, color)
          pushVertex(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry, color)
        }
      }

      function drawRing(radius, color, width) {
        const step = 96
        const half = width * 0.5
        for (let i = 0; i < step; i += 1) {
          const a0 = i / step * Math.PI * 2
          const a1 = (i + 1) / step * Math.PI * 2
          const c0 = Math.cos(a0)
          const s0 = Math.sin(a0)
          const c1 = Math.cos(a1)
          const s1 = Math.sin(a1)
          const rIn = radius - half
          const rOut = radius + half
          pushQuad(
            project(c0 * rIn, s0 * rIn, 0),
            project(c1 * rIn, s1 * rIn, 0),
            project(c1 * rOut, s1 * rOut, 0),
            project(c0 * rOut, s0 * rOut, 0),
            color
          )
        }
      }

      function shouldAnimate() {
        return !disposed
          && !failed
          && !hidden
          && !reducedMotion
          && (prefs.token || prefs.cache || prefs.output || prefs.context)
          && prefs.strength > 0.005
      }

      function stopLoop() {
        if (rafId !== 0) {
          cancelAnimationFrame(rafId)
          rafId = 0
        }
      }

      function fail(error) {
        if (failed || disposed) return
        failed = true
        stopLoop()
        options.onFailure?.(error)
      }

      function startLoop() {
        if (rafId !== 0 || !shouldAnimate()) return
        lastNow = performance.now()
        rafId = requestAnimationFrame(frame)
      }

      function sync() {
        if (disposed || failed) return
        if (shouldAnimate()) startLoop()
        else {
          snapStage()
          stopLoop()
          try {
            renderOnce()
          } catch (error) {
            fail(error)
          }
        }
      }

      function updateScene(now, dt) {
        const targets = stageTargets()
        const stageEase = 1 - Math.exp(-dt * 10)
        stageW += (targets.width - stageW) * stageEase
        stageCX += (targets.center - stageCX) * stageEase
        if (Math.abs(targets.width - stageW) < 0.25) stageW = targets.width
        if (Math.abs(targets.center - stageCX) < 0.25) stageCX = targets.center

        const active = running ? 1 : 0.28
        const speed = 0.55 + cacheN * 2.2
        const base = 0.09 + contextN * 0.32 + tokenN * 0.24
        const outputDrive = prefs.output ? outputN : 0
        const sensitivity = clamp(
          isFiniteNumber(prefs.sensitivity) ? prefs.sensitivity : DEFAULT_PREFS.sensitivity,
          0.3,
          3
        )
        const gain = sensitivity / DEFAULT_PREFS.sensitivity
        const smoothing = clamp(
          isFiniteNumber(prefs.smoothing) ? prefs.smoothing : DEFAULT_PREFS.smoothing,
          0,
          95
        ) / 100
        const smoothingBase = 0.45 + smoothing * 0.53
        const smoothingRate = -Math.log(smoothingBase) * 60 * (running ? 1 : 0.35)
        const follow = 1 - Math.exp(-dt * smoothingRate)
        const pulseAge = (now - pulseAt) / 1000
        const pulseLive = running && prefs.token && pulseAge >= 0 && pulseAge < 2.2
        const pulseWave = 1 + pulseAge * 8.5
        const pulseDecay = pulseLive ? Math.max(0, 1 - pulseAge / 2.2) : 0

        for (const rod of RODS) {
          const phase = rod.r * 0.58
            - simTime * speed
            + Math.sin(rod.x * 0.27 + rod.z * 0.19) * 1.2
            + rod.seed * 0.7
          const wave = 0.5 + 0.5 * Math.sin(phase)
          const cross = 0.5 + 0.5 * Math.sin(
            rod.x * 0.9 + rod.z * 0.6 + simTime * (0.4 + cacheN * 0.9) + rod.seed * 6.28
          )
          const shimmer = 0.5 + 0.5 * Math.sin(
            rod.seed * 41.7 + rod.r * 3.1 + simTime * (10 + outputN * 18)
          )
          let amp = base * (0.55 + 0.45 * wave) * (0.7 + 0.3 * cross) * active
          amp += outputDrive * 0.16 * shimmer * active
          if (pulseLive) {
            const distance = Math.abs(rod.r - pulseWave)
            if (distance < 2.4) {
              amp += (1 - distance / 2.4) * pulseDecay * (0.9 + tokenN * 0.8)
            }
          }
          amp = Math.min(2.6, amp * gain)
          rod.amp = amp
          const target = 0.07 + amp * 4.8
          rod.h += (target - rod.h) * follow
        }

        angle = -0.32 + simTime * 0.018 + Math.sin(simTime * 0.1) * 0.04
        tilt = 0.58 + Math.sin(simTime * 0.07) * 0.025
        bloom.setParams({
          intensity: clamp(
            1.15 + contextN * 0.75 + tokenN * 0.3 + outputDrive * 0.12 + pulseDecay * 0.45,
            0.9,
            2.8
          ),
          threshold: clamp(0.46 - contextN * 0.1 - pulseDecay * 0.06, 0.26, 0.62),
          radius: 1.5,
        })
      }

      function drawScene(now) {
        vp = 0
        drawRing(16.4, C.ringOuterDark, 1.2)
        drawRing(16.5, C.ringMain, 0.12)
        drawRing(16.0, C.ringInner, 0.06)
        drawRing(17.3, C.ringOuter, 0.06)

        for (let i = 0; i < 80; i += 1) {
          const a = i / 80 * Math.PI * 2
          const a2 = a + 0.034
          const r0 = 15.7
          const r1 = 16.15
          pushQuad(
            project(Math.cos(a) * r0, Math.sin(a) * r0, 0),
            project(Math.cos(a2) * r0, Math.sin(a2) * r0, 0),
            project(Math.cos(a2) * r1, Math.sin(a2) * r1, 0),
            project(Math.cos(a) * r1, Math.sin(a) * r1, 0),
            i % 2 === 1 ? C.tickA : C.tickB
          )
        }

        const sorted = [...RODS].sort((a, b) => (
          (a.x * Math.sin(angle) + a.z * Math.cos(angle))
          - (b.x * Math.sin(angle) + b.z * Math.cos(angle))
        ))
        const S = 0.44
        const dotSize = reactorScale() * 0.12
        const edgeWidth = Math.max(0.8 * zoom, 0.7)
        const pulseAge = (now - pulseAt) / 1000
        const pulseGlow = running && prefs.token && pulseAge >= 0 && pulseAge < 2.2
          ? Math.max(0, 1 - pulseAge / 2.2)
          : 0
        const contextHeat = prefs.context ? contextN : 0.2
        const heat = clamp(contextHeat * 0.9 + pulseGlow * 0.25, 0, 1)
        const sa = Math.sin(angle)
        const ca = Math.cos(angle)

        for (const rod of sorted) {
          const amp = rod.amp
          const height = rod.h
          const { x, z } = rod
          const a0 = project(x - S, z - S, 0)
          const b0 = project(x + S, z - S, 0)
          const c0 = project(x + S, z + S, 0)
          const d0 = project(x - S, z + S, 0)
          const a = project(x - S, z - S, height)
          const b = project(x + S, z - S, height)
          const c = project(x + S, z + S, height)
          const d = project(x - S, z + S, height)

          pushQuad(a, b, b0, a0, C.side1)
          pushQuad(b, c, c0, b0, rgb(55 + amp * 30, 62 + amp * 30, 44 + amp * 20))
          pushQuad(c, d, d0, c0, C.side3)
          pushQuad(d, a, a0, d0, C.side4)

          const seed = rod.seed
          let base
          if (seed > 0.92) base = [143, 109, 81]
          else if (seed > 0.85) base = [97, 118, 104]
          else base = [139 + seed * 29, 148 + seed * 22, 119 + seed * 21]
          let r = base[0] + amp * 43
          let g = base[1] + amp * 40
          let bcol = base[2] + amp * 24
          if (heat > 0) {
            r += (232 - r) * heat * 0.32
            g += (186 - g) * heat * 0.32
            bcol += (118 - bcol) * heat * 0.32
          }
          pushQuad(a, b, c, d, rgb(r, g, bcol))

          pushEdge(a, b, C.edge, edgeWidth)
          pushEdge(b, c, C.edge, edgeWidth)
          pushEdge(c, d, C.edge, edgeWidth)
          pushEdge(d, a, C.edge, edgeWidth)

          const rzA = -sa - ca
          const rzB = sa - ca
          const rzC = sa + ca
          const rzD = -sa + ca
          const edges = [
            { rz: rzA, p1: a, p2: a0 },
            { rz: rzB, p1: b, p2: b0 },
            { rz: rzC, p1: c, p2: c0 },
            { rz: rzD, p1: d, p2: d0 },
          ].sort((m, n) => n.rz - m.rz)
          pushEdge(edges[0].p1, edges[0].p2, C.edge, edgeWidth)
          pushEdge(edges[1].p1, edges[1].p2, C.edge, edgeWidth)

          const cp = project(x, z, height + 0.01)
          pushDisc(cp[0], cp[1], dotSize, dotSize * tilt, C.rodDot, 12)
        }

        const vertexCount = vp / 6
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData.subarray(0, vp))
        gl.disable(gl.DEPTH_TEST)

        bloom.beginScene()
        gl.useProgram(mainProgram)
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.enableVertexAttribArray(mainProgramInfo.aPos)
        gl.vertexAttribPointer(mainProgramInfo.aPos, 3, gl.FLOAT, false, 24, 0)
        gl.enableVertexAttribArray(mainProgramInfo.aColor)
        gl.vertexAttribPointer(mainProgramInfo.aColor, 3, gl.FLOAT, false, 24, 12)
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount)
        gl.disableVertexAttribArray(mainProgramInfo.aPos)
        gl.disableVertexAttribArray(mainProgramInfo.aColor)
        bloom.endScene()
      }

      function renderOnce() {
        if (disposed || failed || bloom === null) return
        snapStage()
        updateScene(performance.now(), 0.016)
        drawScene(performance.now())
      }

      function frame(now) {
        rafId = 0
        if (disposed || failed) return
        try {
          if (!shouldAnimate()) {
            renderOnce()
            return
          }
          if (!running && now - lastDraw < 33) {
            rafId = requestAnimationFrame(frame)
            return
          }
          const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000)) || 0.016
          lastNow = now
          lastDraw = now
          simTime += dt * (running ? 1 : 0.32)
          updateScene(now, dt)
          drawScene(now)
          rafId = requestAnimationFrame(frame)
        } catch (error) {
          fail(error)
        }
      }

      function measure() {
        if (disposed) return
        resizeRaf = 0
        try {
          const rect = canvas.getBoundingClientRect()
          const cssW = Math.max(1, rect.width)
          const cssH = Math.max(1, rect.height)
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
          const pixelBudget = 2400000
          const scale = Math.min(dpr, Math.sqrt(pixelBudget / (cssW * cssH)))
          const nextW = Math.max(1, Math.round(cssW * scale))
          const nextH = Math.max(1, Math.round(cssH * scale))
          if (canvas.width !== nextW || canvas.height !== nextH) {
            canvas.width = nextW
            canvas.height = nextH
            bloom.resize(nextW, nextH)
          }
          viewW = cssW
          viewH = cssH
          gl.viewport(0, 0, canvas.width, canvas.height)
          if (!shouldAnimate()) {
            snapStage()
            renderOnce()
          }
        } catch (error) {
          fail(error)
        }
      }

      function scheduleMeasure() {
        if (resizeRaf !== 0) return
        resizeRaf = requestAnimationFrame(measure)
      }

      function onVisibility() {
        hidden = document.visibilityState === 'hidden'
        sync()
      }

      function onMotionChange(event) {
        reducedMotion = event.matches
        sync()
      }

      function onContextLost(event) {
        event.preventDefault()
        fail(new Error('WebGL context lost'))
      }

      function dispose() {
        if (disposed) return
        disposed = true
        stopLoop()
        if (resizeRaf !== 0) cancelAnimationFrame(resizeRaf)
        if (resizeObserver !== null) resizeObserver.disconnect()
        window.removeEventListener('resize', scheduleMeasure)
        document.removeEventListener('visibilitychange', onVisibility)
        canvas.removeEventListener('webglcontextlost', onContextLost)
        if (motionQuery !== null) {
          if (typeof motionQuery.removeEventListener === 'function') {
            motionQuery.removeEventListener('change', onMotionChange)
          } else if (typeof motionQuery.removeListener === 'function') {
            motionQuery.removeListener(onMotionChange)
          }
        }
        if (bloom !== null) {
          try { bloom.dispose() } catch {}
        }
        if (mainProgram !== null) gl.deleteProgram(mainProgram)
        if (vbo !== null) gl.deleteBuffer(vbo)
        mainProgram = null
        vbo = null
        bloom = null
      }

      try {
        mainProgram = compileProgram(gl, VS_MAIN, FS_MAIN, 'reactor')
        mainProgramInfo = {
          aPos: gl.getAttribLocation(mainProgram, 'aPos'),
          aColor: gl.getAttribLocation(mainProgram, 'aColor'),
        }
        vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW)

        const rect = canvas.getBoundingClientRect()
        const cssW = Math.max(1, rect.width)
        const cssH = Math.max(1, rect.height)
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const scale = Math.min(dpr, Math.sqrt(2400000 / (cssW * cssH)))
        canvas.width = Math.max(1, Math.round(cssW * scale))
        canvas.height = Math.max(1, Math.round(cssH * scale))
        viewW = cssW
        viewH = cssH
        stageW = cssW
        stageCX = cssW / 2

        bloom = createBloom(gl)
        bloom.init()
        bloom.resize(canvas.width, canvas.height)
        gl.viewport(0, 0, canvas.width, canvas.height)

        motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        reducedMotion = motionQuery.matches
        if (typeof motionQuery.addEventListener === 'function') {
          motionQuery.addEventListener('change', onMotionChange)
        } else if (typeof motionQuery.addListener === 'function') {
          motionQuery.addListener(onMotionChange)
        }
        canvas.addEventListener('webglcontextlost', onContextLost)
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('resize', scheduleMeasure)
        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(scheduleMeasure)
          resizeObserver.observe(canvas)
        }
        renderOnce()
      } catch (error) {
        dispose()
        throw error
      }

      return {
        setState(next) {
          if (disposed || failed) return
          const nextPrefs = {
            ...DEFAULT_PREFS,
            ...(next?.prefs !== null && typeof next?.prefs === 'object' ? next.prefs : {}),
          }
          nextPrefs.token = nextPrefs.token !== false
          nextPrefs.cache = nextPrefs.cache !== false
          nextPrefs.output = nextPrefs.output !== false
          nextPrefs.context = nextPrefs.context !== false
          nextPrefs.strength = isFiniteNumber(nextPrefs.strength)
            ? clamp(nextPrefs.strength, 0, 1)
            : DEFAULT_PREFS.strength
          nextPrefs.sensitivity = isFiniteNumber(nextPrefs.sensitivity)
            ? clamp(nextPrefs.sensitivity, 0.3, 3)
            : DEFAULT_PREFS.sensitivity
          nextPrefs.smoothing = isFiniteNumber(nextPrefs.smoothing)
            ? clamp(nextPrefs.smoothing, 0, 95)
            : DEFAULT_PREFS.smoothing
          prefs = nextPrefs
          running = next?.running === true
          const tokenValue = isFiniteNumber(next?.tokenTotal)
            ? Math.max(0, next.tokenTotal)
            : null
          const cacheValue = isFiniteNumber(next?.cacheRatio)
            ? clamp(next.cacheRatio)
            : null
          const outputValue = isFiniteNumber(next?.outputSpeed)
            ? Math.max(0, next.outputSpeed)
            : null
          const contextValue = isFiniteNumber(next?.contextRatio)
            ? clamp(next.contextRatio)
            : null
          stageTargetW = isFiniteNumber(next?.stageWidth) && next.stageWidth > 1
            ? next.stageWidth
            : null
          stageTargetCX = isFiniteNumber(next?.stageCenterX)
            ? next.stageCenterX
            : null
          tokenN = prefs.token
            ? tokenValue === null
              ? 0.3
              : clamp(Math.log10(1 + tokenValue) / Math.log10(1 + 200000))
            : 0.3
          cacheN = prefs.cache
            ? cacheValue === null ? 0.3 : cacheValue
            : 0.3
          outputN = prefs.output
            ? outputValue === null ? 0 : clamp(outputValue / 120)
            : 0.3
          contextN = prefs.context
            ? contextValue === null ? 0.3 : contextValue
            : 0.3
          const nextPulse = isFiniteNumber(next?.pulse) ? next.pulse : 0
          if (nextPulse > lastPulse && running && prefs.token) {
            pulseAt = performance.now()
          }
          lastPulse = nextPulse
          pulse = nextPulse
          sync()
        },
        dispose,
      }
    }

    /* ------------------------------------------------------------------ */
    /* CSS                                                                 */
    /* ------------------------------------------------------------------ */

    const LAYER_CSS = `
      .dsh-fr-layer {
        position: fixed;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        --fr-strength: 0.6;
        --fr-cx: 50%;
        --fr-stage-w: 100vw;
        --fr-stage-left: 0px;
        --fr-stage-right: 100vw;
        --fr-edge-fade: 0px;
        --fr-bg-cx: 50%;
        --fr-bg-0: transparent;
        --fr-bg-43: transparent;
        --fr-bg-78: transparent;
      }
      .dsh-fr-menu,
      .dsh-fr-menu *,
      .dsh-fr-trigger {
        box-sizing: border-box;
      }
      .dsh-fr-global {
        position: absolute;
        top: 0;
        bottom: 0;
        left: var(--fr-stage-left, 0px);
        width: calc(var(--fr-stage-right, 100vw) - var(--fr-stage-left, 0px));
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        background: radial-gradient(
          ellipse at var(--fr-bg-cx, 50%) 49%,
          var(--fr-bg-0) 0%,
          var(--fr-bg-43) 43%,
          var(--fr-bg-78) 78%
        );
        transition: background 0.25s ease;
      }
      .dsh-fr-layer.is-sidebar-sync .dsh-fr-global {
        left: 0;
        width: 100%;
      }
      .dsh-fr-canvas {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        display: block;
        pointer-events: none;
        opacity: var(--fr-strength);
        mix-blend-mode: screen;
        clip-path: inset(
          0
          max(0px, calc(100% - var(--fr-stage-right, 100vw)))
          0
          var(--fr-stage-left, 0px)
        );
        -webkit-mask-image:
          linear-gradient(to bottom, #000 0%, #000 70%, transparent 95%),
          linear-gradient(
            to right,
            transparent var(--fr-stage-left, 0px),
            #000 calc(var(--fr-stage-left, 0px) + var(--fr-edge-fade, 0px)),
            #000 calc(var(--fr-stage-right, 100vw) - var(--fr-edge-fade, 0px)),
            transparent var(--fr-stage-right, 100vw)
          );
        -webkit-mask-composite: source-in;
        mask-image:
          linear-gradient(to bottom, #000 0%, #000 70%, transparent 95%),
          linear-gradient(
            to right,
            transparent var(--fr-stage-left, 0px),
            #000 calc(var(--fr-stage-left, 0px) + var(--fr-edge-fade, 0px)),
            #000 calc(var(--fr-stage-right, 100vw) - var(--fr-edge-fade, 0px)),
            transparent var(--fr-stage-right, 100vw)
          );
        mask-composite: intersect;
        transition: opacity 0.25s ease;
      }
      .dsh-fr-fallback {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        opacity: var(--fr-strength);
        background: radial-gradient(ellipse 52% 38% at var(--fr-cx, 50%) 55%, rgba(222, 236, 149, 0.12), rgba(222, 236, 149, 0.03) 48%, transparent 72%);
        clip-path: inset(
          0
          max(0px, calc(100% - var(--fr-stage-right, 100vw)))
          0
          var(--fr-stage-left, 0px)
        );
        -webkit-mask-image: linear-gradient(
          to right,
          transparent var(--fr-stage-left, 0px),
          #000 calc(var(--fr-stage-left, 0px) + var(--fr-edge-fade, 0px)),
          #000 calc(var(--fr-stage-right, 100vw) - var(--fr-edge-fade, 0px)),
          transparent var(--fr-stage-right, 100vw)
        );
        mask-image: linear-gradient(
          to right,
          transparent var(--fr-stage-left, 0px),
          #000 calc(var(--fr-stage-left, 0px) + var(--fr-edge-fade, 0px)),
          #000 calc(var(--fr-stage-right, 100vw) - var(--fr-edge-fade, 0px)),
          transparent var(--fr-stage-right, 100vw)
        );
      }
      .dsh-fr-fallback::before {
        content: "";
        position: absolute;
        left: var(--fr-cx, 50%);
        top: 55%;
        width: min(calc(var(--fr-stage-w, 100vw) * 0.78), 82vh, 820px);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px solid rgba(222, 236, 149, 0.16);
        box-shadow:
          inset 0 0 84px rgba(222, 236, 149, 0.06),
          0 0 84px rgba(222, 236, 149, 0.07);
      }
      .dsh-fr-fallback::after {
        content: "";
        position: absolute;
        left: var(--fr-cx, 50%);
        top: 55%;
        width: min(calc(var(--fr-stage-w, 100vw) * 0.46), 62vh, 500px);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(222, 236, 149, 0.11), transparent 68%);
        filter: blur(18px);
      }
      body:not([data-ds-dark-theme]) .dsh-fr-global {
        opacity: 0.72;
      }
      body:not([data-ds-dark-theme]) .dsh-fr-canvas {
        opacity: calc(var(--fr-strength) * 0.7);
        mix-blend-mode: multiply;
        filter: saturate(0.86) brightness(0.94);
      }
      body:not([data-ds-dark-theme]) .dsh-fr-fallback {
        opacity: calc(var(--fr-strength) * 0.8);
        background: radial-gradient(ellipse 52% 38% at var(--fr-cx, 50%) 55%, rgba(129, 148, 94, 0.15), rgba(129, 148, 94, 0.04) 48%, transparent 72%);
      }
      body:not([data-ds-dark-theme]) .dsh-fr-fallback::before {
        border-color: rgba(92, 108, 66, 0.22);
        box-shadow:
          inset 0 0 84px rgba(92, 108, 66, 0.06),
          0 0 84px rgba(92, 108, 66, 0.07);
      }
      body:not([data-ds-dark-theme]) .dsh-fr-fallback::after {
        background: radial-gradient(circle, rgba(129, 148, 94, 0.12), transparent 68%);
      }
      .dsh-fr-control {
        position: fixed;
        right: 18px;
        bottom: max(18px, env(safe-area-inset-bottom));
        z-index: 6;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .dsh-fr-trigger {
        position: relative;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px;
        color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-1);
        background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 84%, transparent);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
        -webkit-backdrop-filter: blur(14px) saturate(1.2);
        backdrop-filter: blur(14px) saturate(1.2);
        cursor: pointer;
        pointer-events: auto;
        transition:
          transform 0.16s ease,
          color 0.16s ease,
          background 0.16s ease,
          border-color 0.16s ease;
      }
      .dsh-fr-trigger:hover {
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l2);
        transform: translateY(-1px);
      }
      .dsh-fr-trigger:active {
        transform: translateY(0) scale(0.97);
      }
      .dsh-fr-trigger[aria-expanded="true"] {
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-brand-primary);
      }
      .dsh-fr-trigger:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 3px;
      }
      .dsh-fr-live {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--dsw-alias-state-idle-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-bg-layer-1) 82%, transparent);
      }
      .dsh-fr-trigger.is-running .dsh-fr-live {
        background: var(--dsw-alias-state-success-primary);
        animation: dsh-fr-live 2.8s ease-in-out infinite;
      }
      @keyframes dsh-fr-live {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-bg-layer-1) 82%, transparent), 0 0 7px var(--dsw-alias-state-success-primary); }
        50% { opacity: 0.72; box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-bg-layer-1) 82%, transparent), 0 0 2px var(--dsw-alias-state-success-primary); }
      }
      .dsh-fr-menu {
        position: absolute;
        right: 0;
        bottom: calc(100% + 10px);
        width: 316px;
        max-width: calc(100vw - 24px);
        max-height: min(82vh, 720px);
        box-sizing: border-box;
        overflow-y: auto;
        overscroll-behavior: contain;
        pointer-events: auto;
        padding: 14px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 16px;
        color: var(--dsw-alias-label-primary);
        background: var(--dsw-alias-bg-layer-1);
        background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 95%, transparent);
        box-shadow:
          0 24px 64px rgba(0, 0, 0, 0.34),
          0 1px 0 rgba(255, 255, 255, 0.07) inset;
        -webkit-backdrop-filter: blur(22px) saturate(1.15);
        backdrop-filter: blur(22px) saturate(1.15);
        animation: dsh-fr-menu-in 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
        transform-origin: bottom right;
      }
      .dsh-fr-menu:focus {
        outline: none;
      }
      .dsh-fr-menu::before {
        content: "";
        position: absolute;
        top: 0;
        left: 18px;
        right: 18px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--dsw-alias-brand-primary), transparent);
        opacity: 0.55;
        pointer-events: none;
      }
      @keyframes dsh-fr-menu-in {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .dsh-fr-menu-head {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 2px 2px 12px;
      }
      .dsh-fr-menu-copy {
        min-width: 0;
        flex: 1;
      }
      .dsh-fr-menu-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        letter-spacing: 0.01em;
      }
      .dsh-fr-menu-sub {
        margin-top: 3px;
        font: 10px ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        line-height: 14px;
        letter-spacing: 0.1em;
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-fr-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex: none;
        padding: 3px 7px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 14px;
        white-space: nowrap;
      }
      .dsh-fr-status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--dsw-alias-state-idle-primary);
      }
      .dsh-fr-status-pill.is-running .dsh-fr-status-dot {
        background: var(--dsw-alias-state-success-primary);
        box-shadow: 0 0 6px var(--dsw-alias-state-success-primary);
      }
      .dsh-fr-close {
        flex: none;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 8px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        cursor: pointer;
      }
      .dsh-fr-close:hover {
        color: var(--dsw-alias-label-primary);
        background: var(--dsw-alias-bg-layer-2);
      }
      .dsh-fr-close:focus-visible,
      .dsh-fr-row:focus-visible,
      .dsh-fr-reset:focus-visible,
      .dsh-fr-range:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .dsh-fr-section {
        border-top: 1px solid var(--dsw-alias-border-l1);
        padding: 10px 0 7px;
      }
      .dsh-fr-section-label {
        padding: 2px 8px 7px;
        color: var(--dsw-alias-label-secondary);
        font: 10px ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        line-height: 14px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .dsh-fr-bg-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 7px;
        padding: 0 8px;
      }
      .dsh-fr-bg-option {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 5px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        color: inherit;
        background: transparent;
        font: inherit;
        cursor: pointer;
      }
      .dsh-fr-bg-swatch {
        position: relative;
        display: block;
        height: 34px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 9px;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          inset 0 -14px 20px rgba(0, 0, 0, 0.16);
        transition:
          transform 0.16s ease,
          border-color 0.16s ease,
          box-shadow 0.16s ease;
      }
      .dsh-fr-bg-option:hover .dsh-fr-bg-swatch {
        transform: translateY(-1px);
        border-color: var(--dsw-alias-border-l2);
      }
      .dsh-fr-bg-option[aria-pressed="true"] .dsh-fr-bg-swatch {
        border-color: var(--dsw-alias-brand-primary);
        box-shadow:
          0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.16);
      }
      .dsh-fr-bg-check {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 13px;
        height: 13px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: rgba(5, 8, 6, 0.55);
        color: #fff;
      }
      .dsh-fr-bg-check svg {
        display: block;
      }
      .dsh-fr-bg-name {
        overflow: hidden;
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 14px;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.14s ease;
      }
      .dsh-fr-bg-option[aria-pressed="true"] .dsh-fr-bg-name {
        color: var(--dsw-alias-label-primary);
      }
      .dsh-fr-bg-option:focus-visible {
        outline: none;
      }
      .dsh-fr-bg-option:focus-visible .dsh-fr-bg-swatch {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .dsh-fr-bg-sync {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
        padding: 8px;
        border: 1px solid transparent;
        border-radius: 10px;
        color: inherit;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.14s ease, border-color 0.14s ease;
      }
      .dsh-fr-bg-sync:hover {
        background: var(--dsw-alias-bg-layer-2);
      }
      .dsh-fr-bg-sync:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .dsh-fr-bg-sync-copy {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .dsh-fr-bg-sync-label {
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-fr-bg-sync-hint {
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 14px;
      }
      .dsh-fr-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 8px;
        border: 1px solid transparent;
        border-radius: 10px;
        color: inherit;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.14s ease, border-color 0.14s ease;
      }
      .dsh-fr-row:hover {
        background: var(--dsw-alias-bg-layer-2);
      }
      .dsh-fr-row-dot {
        width: 7px;
        height: 7px;
        flex: none;
        border-radius: 50%;
        background: var(--fr-metric-color);
        box-shadow: 0 0 7px color-mix(in srgb, var(--fr-metric-color) 70%, transparent);
      }
      .dsh-fr-row[aria-checked="false"] .dsh-fr-row-dot {
        opacity: 0.38;
        box-shadow: none;
      }
      .dsh-fr-row-copy {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .dsh-fr-row-top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
      }
      .dsh-fr-row-label {
        font-size: 13px;
        line-height: 18px;
        color: var(--dsw-alias-label-primary);
      }
      .dsh-fr-row[aria-checked="false"] .dsh-fr-row-label {
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-fr-row-value {
        flex: none;
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 16px;
        font-variant-numeric: tabular-nums;
      }
      .dsh-fr-row-hint {
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-fr-switch {
        position: relative;
        width: 32px;
        height: 18px;
        flex: none;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2);
        transition: background 0.16s ease, border-color 0.16s ease;
      }
      .dsh-fr-switch::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--dsw-alias-label-secondary);
        transition: transform 0.16s ease, background 0.16s ease;
      }
      .dsh-fr-row[aria-checked="true"] .dsh-fr-switch,
      .dsh-fr-bg-sync[aria-checked="true"] .dsh-fr-switch {
        background: var(--dsw-alias-brand-primary);
        border-color: transparent;
      }
      .dsh-fr-row[aria-checked="true"] .dsh-fr-switch::after,
      .dsh-fr-bg-sync[aria-checked="true"] .dsh-fr-switch::after {
        transform: translateX(14px);
        background: var(--dsw-alias-bg-base);
      }
      .dsh-fr-slider + .dsh-fr-slider {
        margin-top: 8px;
      }
      .dsh-fr-strength-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding: 2px 8px 0;
      }
      .dsh-fr-strength-label {
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-fr-strength-value {
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        font-variant-numeric: tabular-nums;
      }
      .dsh-fr-range {
        display: block;
        width: 100%;
        height: 22px;
        margin: 4px 0 0;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
      }
      .dsh-fr-range::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(
          to right,
          var(--dsw-alias-brand-primary) 0 var(--fr-pct),
          var(--dsw-alias-bg-layer-2) var(--fr-pct) 100%
        );
      }
      .dsh-fr-range::-webkit-slider-thumb {
        width: 14px;
        height: 14px;
        margin-top: -5px;
        border: 2px solid var(--dsw-alias-bg-overlay);
        border-radius: 50%;
        background: var(--dsw-alias-label-primary);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
        -webkit-appearance: none;
        appearance: none;
      }
      .dsh-fr-range::-moz-range-track {
        height: 4px;
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2);
      }
      .dsh-fr-range::-moz-range-progress {
        height: 4px;
        border-radius: 999px;
        background: var(--dsw-alias-brand-primary);
      }
      .dsh-fr-range::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border: 2px solid var(--dsw-alias-bg-overlay);
        border-radius: 50%;
        background: var(--dsw-alias-label-primary);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
      }
      .dsh-fr-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 11px 8px 0;
        border-top: 1px solid var(--dsw-alias-border-l1);
      }
      .dsh-fr-reset {
        padding: 3px 0;
        border: 0;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        font: inherit;
        font-size: 11px;
        line-height: 16px;
        cursor: pointer;
      }
      .dsh-fr-reset:hover {
        color: var(--dsw-alias-label-primary);
        text-decoration: underline;
      }
      .dsh-fr-cost {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1px;
      }
      .dsh-fr-cost-label {
        color: var(--dsw-alias-label-secondary);
        font-size: 9px;
        line-height: 12px;
        letter-spacing: 0.1em;
        white-space: nowrap;
      }
      .dsh-fr-cost-value {
        color: var(--dsw-alias-label-primary);
        font: 11px ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        line-height: 15px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .dsh-fr-cost-value.is-muted {
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-fr-footnote {
        margin: 8px 8px 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 10px;
        line-height: 14px;
        opacity: 0.78;
      }
      .dsh-fr-end {
        margin: 0;
      }
      @media (max-width: 720px) {
        .dsh-fr-control {
          right: 12px;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
        }
        .dsh-fr-menu {
          width: min(316px, calc(100vw - 20px));
          max-height: calc(100vh - 150px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-fr-canvas,
        .dsh-fr-global,
        .dsh-fr-fallback,
        .dsh-fr-trigger,
        .dsh-fr-live,
        .dsh-fr-menu,
        .dsh-fr-switch,
        .dsh-fr-switch::after,
        .dsh-fr-bg-swatch,
        .dsh-fr-bg-sync,
        .dsh-fr-range {
          animation: none !important;
          transition: none !important;
        }
      }
    `

    /* ------------------------------------------------------------------ */
    /* Settings UI                                                         */
    /* ------------------------------------------------------------------ */

    function MetricRow({ t, metric, value, enabled, onToggle }) {
      const label = t(`metric.${metric.key}`)
      const state = enabled ? t('on') : t('off')
      const hint = t(`hint.${metric.key}`)
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': enabled,
        'aria-label': `${label}: ${value}, ${state}. ${hint}`,
        title: `${label} · ${hint}`,
        className: 'dsh-fr-row',
        style: { '--fr-metric-color': metric.color },
        onClick: () => onToggle(metric.key),
      },
        h('span', { className: 'dsh-fr-row-dot', 'aria-hidden': 'true' }),
        h('span', { className: 'dsh-fr-row-copy' },
          h('span', { className: 'dsh-fr-row-top' },
            h('span', { className: 'dsh-fr-row-label' }, label),
            h('span', { className: 'dsh-fr-row-value' }, value)
          ),
          h('span', { className: 'dsh-fr-row-hint' }, hint)
        ),
        h('span', { className: 'dsh-fr-switch', 'aria-hidden': 'true' })
      )
    }

    function BackdropOption({ t, option, selected, onSelect }) {
      const label = t(`background.${option.key}`)
      return h('button', {
        type: 'button',
        className: 'dsh-fr-bg-option',
        'aria-pressed': selected,
        'aria-label': label,
        title: label,
        onClick: () => onSelect(option.key),
      },
        h('span', {
          className: 'dsh-fr-bg-swatch',
          style: { background: option.swatch },
          'aria-hidden': 'true',
        },
          selected
            ? h('span', { className: 'dsh-fr-bg-check' },
              h('svg', {
                viewBox: '0 0 10 10',
                width: 8,
                height: 8,
                'aria-hidden': 'true',
                focusable: 'false',
              },
                h('path', {
                  d: 'M2 5.2l2 2 4-4.4',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                })
              )
            )
            : null
        ),
        h('span', { className: 'dsh-fr-bg-name' }, label)
      )
    }

    function RangeSetting({ id, label, value, display, min, max, step, onChange }) {
      const percent = max > min ? clamp((value - min) / (max - min)) * 100 : 0
      return h('div', { className: 'dsh-fr-slider' },
        h('div', { className: 'dsh-fr-strength-head' },
          h('label', { className: 'dsh-fr-strength-label', htmlFor: id }, label),
          h('span', { className: 'dsh-fr-strength-value' }, display)
        ),
        h('input', {
          id,
          className: 'dsh-fr-range',
          type: 'range',
          min,
          max,
          step,
          value,
          'aria-label': label,
          style: { '--fr-pct': percent + '%' },
          onChange: (event) => onChange(Number(event.target.value)),
        })
      )
    }

    function SettingsMenu(props) {
      const {
        t,
        snapshot,
        webglFailed,
        panelRef,
        currency = 'CNY',
        onClose,
        onToggle,
        onStrength,
        onSensitivity,
        onSmoothing,
        onBackdrop,
        onSidebarSync,
        onReset,
      } = props
      const prefs = snapshot.prefs
      const [costNow, setCostNow] = React.useState(() => Date.now())
      React.useEffect(() => {
        const id = window.setInterval(() => setCostNow(Date.now()), 60000)
        return () => window.clearInterval(id)
      }, [])
      const peak = isPeakCostTime(new Date(costNow))
      const sidebarSync = prefs.sidebarSync === true
      const usageReady = isFiniteNumber(snapshot.tokenTotal) && snapshot.tokenTotal > 0
      const cost = usageReady ? estimateSessionCost(snapshot, currency, peak) : null
      const costText = cost === null ? NO_VALUE : `≈ ${formatCost(cost, currency)}`
      const costTitle = !usageReady
        ? t('settings.costNoUsage')
        : cost === null
          ? t('settings.costUnknown')
          : [
            t('settings.costEstimate'),
            t(peak ? 'settings.peak' : 'settings.offPeak'),
            snapshot.modelProvider !== null && snapshot.modelId !== null
              ? `${snapshot.modelProvider}/${snapshot.modelId}`
              : null,
          ].filter(Boolean).join(' · ')
      const strength = Math.round(prefs.strength * 100)
      const sensitivity = clamp(
        isFiniteNumber(prefs.sensitivity) ? prefs.sensitivity : DEFAULT_PREFS.sensitivity,
        0.3,
        3
      )
      const smoothing = Math.round(clamp(
        isFiniteNumber(prefs.smoothing) ? prefs.smoothing : DEFAULT_PREFS.smoothing,
        0,
        95
      ))
      const backdrop = BACKDROP_BY_KEY[prefs.backdrop] ? prefs.backdrop : DEFAULT_PREFS.backdrop
      const running = snapshot.running
      const values = {
        token: formatTokens(snapshot.tokenTotal),
        cache: formatPercent(snapshot.cacheRatio),
        output: formatSpeed(snapshot.outputSpeed, t('unit.tokPerSec')),
        context: formatPercent(snapshot.contextRatio),
      }
      return h('div', {
        ref: panelRef,
        id: 'dsh-fr-settings-menu',
        className: 'dsh-fr-menu',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-labelledby': 'dsh-fr-menu-title',
        tabIndex: -1,
      },
        h('div', { className: 'dsh-fr-menu-head' },
          h('div', { className: 'dsh-fr-menu-copy' },
            h('h2', { id: 'dsh-fr-menu-title', className: 'dsh-fr-menu-title' }, t('settings.title')),
            h('div', { className: 'dsh-fr-menu-sub' }, t('settings.subtitle'))
          ),
          h('span', { className: 'dsh-fr-status-pill' + (running ? ' is-running' : '') },
            h('span', { className: 'dsh-fr-status-dot', 'aria-hidden': 'true' }),
            h('span', null, running ? t('running') : t('idle'))
          ),
          h('button', {
            type: 'button',
            className: 'dsh-fr-close',
            'aria-label': t('settings.close'),
            title: t('settings.close'),
            onClick: () => onClose(true),
          },
            h('svg', {
              viewBox: '0 0 16 16',
              width: 14,
              height: 14,
              'aria-hidden': 'true',
              focusable: 'false',
            },
              h('path', {
                d: 'M4 4l8 8M12 4l-8 8',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
              })
            )
          )
        ),
        h('div', { className: 'dsh-fr-section' },
          h('div', { className: 'dsh-fr-section-label' }, t('settings.metrics')),
          h('div', { className: 'dsh-fr-end' },
            METRICS.map((metric) => h(MetricRow, {
              key: metric.key,
              t,
              metric,
              value: values[metric.key],
              enabled: prefs[metric.key] !== false,
              onToggle,
            }))
          )
        ),
        h('div', { className: 'dsh-fr-section' },
          h('div', { className: 'dsh-fr-section-label' }, t('settings.background')),
          h('div', { className: 'dsh-fr-bg-grid' },
            BACKDROPS.map((option) => h(BackdropOption, {
              key: option.key,
              t,
              option,
              selected: option.key === backdrop,
              onSelect: onBackdrop,
            }))
          ),
          h('button', {
            type: 'button',
            role: 'switch',
            'aria-checked': sidebarSync,
            'aria-label': `${t('settings.sidebarSync')}. ${t('settings.sidebarSyncHint')}`,
            title: t('settings.sidebarSyncHint'),
            className: 'dsh-fr-bg-sync',
            onClick: () => onSidebarSync(!sidebarSync),
          },
            h('span', { className: 'dsh-fr-bg-sync-copy' },
              h('span', { className: 'dsh-fr-bg-sync-label' }, t('settings.sidebarSync')),
              h('span', { className: 'dsh-fr-bg-sync-hint' }, t('settings.sidebarSyncHint'))
            ),
            h('span', { className: 'dsh-fr-switch', 'aria-hidden': 'true' })
          )
        ),
        h('div', { className: 'dsh-fr-section' },
          h('div', { className: 'dsh-fr-section-label' }, t('settings.display')),
          h(RangeSetting, {
            id: 'dsh-fr-strength',
            label: t('settings.strength'),
            value: strength,
            display: strength + '%',
            min: 0,
            max: 100,
            step: 1,
            onChange: (value) => onStrength(value / 100),
          }),
          h(RangeSetting, {
            id: 'dsh-fr-sensitivity',
            label: t('settings.sensitivity'),
            value: sensitivity,
            display: sensitivity.toFixed(1) + '×',
            min: 0.3,
            max: 3,
            step: 0.1,
            onChange: onSensitivity,
          }),
          h(RangeSetting, {
            id: 'dsh-fr-smoothing',
            label: t('settings.smoothing'),
            value: smoothing,
            display: smoothing + '%',
            min: 0,
            max: 95,
            step: 1,
            onChange: onSmoothing,
          })
        ),
        h('div', { className: 'dsh-fr-footer' },
          h('button', {
            type: 'button',
            className: 'dsh-fr-reset',
            onClick: onReset,
          }, t('settings.reset')),
          h('div', { className: 'dsh-fr-cost', title: costTitle },
            h('span', { className: 'dsh-fr-cost-label' }, t('settings.cost')),
            h('span', {
              className: 'dsh-fr-cost-value' + (cost === null ? ' is-muted' : ''),
            }, costText)
          )
        ),
        h('p', { className: 'dsh-fr-footnote' },
          webglFailed
            ? t('mode.fallback') + ' · ' + t('settings.footnote')
            : t('settings.footnote')
        )
      )
    }

    function createReactorLayer(locale) {
      return function ReactorLayer() {
        const snapshot = useStore()
        const t = useT(locale)
        const [open, setOpen] = React.useState(false)
        const [webglFailed, setWebglFailed] = React.useState(false)
        const canvasRef = React.useRef(null)
        const rendererRef = React.useRef(null)
        const snapshotRef = React.useRef(snapshot)
        const wrapRef = React.useRef(null)
        const panelRef = React.useRef(null)
        const triggerRef = React.useRef(null)
        snapshotRef.current = snapshot

        React.useEffect(() => {
          const canvas = canvasRef.current
          if (canvas === null) return undefined
          let renderer = null
          let failed = false
          try {
            renderer = createReactorRenderer(canvas, {
              onFailure() {
                if (failed) return
                failed = true
                rendererRef.current = null
                setWebglFailed(true)
                try { renderer?.dispose() } catch {}
              },
            })
            if (failed) {
              try { renderer.dispose() } catch {}
              return undefined
            }
            rendererRef.current = renderer
            renderer.setState(snapshotRef.current)
          } catch (error) {
            failed = true
            console.error('[fuel-rods] WebGL2 renderer unavailable', error)
            setWebglFailed(true)
            try { renderer?.dispose() } catch {}
          }
          return () => {
            if (rendererRef.current === renderer) rendererRef.current = null
            try { renderer?.dispose() } catch {}
          }
        }, [])

        React.useEffect(() => {
          rendererRef.current?.setState(snapshot)
        }, [snapshot])

        React.useEffect(() => {
          if (snapshot.sessionId === null) setOpen(false)
        }, [snapshot.sessionId])

        React.useEffect(() => {
          if (!open) return undefined
          const panel = panelRef.current
          if (panel !== null) panel.focus({ preventScroll: true })
          const onKey = (event) => {
            if (event.key !== 'Escape') return
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
            window.requestAnimationFrame(() => {
              triggerRef.current?.focus({ preventScroll: true })
            })
          }
          const onPointer = (event) => {
            const wrap = wrapRef.current
            if (wrap !== null && event.target instanceof Node && wrap.contains(event.target)) return
            setOpen(false)
          }
          document.addEventListener('keydown', onKey, true)
          document.addEventListener('pointerdown', onPointer, true)
          return () => {
            document.removeEventListener('keydown', onKey, true)
            document.removeEventListener('pointerdown', onPointer, true)
          }
        }, [open])

        const closeMenu = (restoreFocus) => {
          setOpen(false)
          if (restoreFocus) {
            window.requestAnimationFrame(() => {
              triggerRef.current?.focus({ preventScroll: true })
            })
          }
        }

        const sessionActive = snapshot.sessionId !== null
        const stageWidth = isFiniteNumber(snapshot.stageWidth) && snapshot.stageWidth > 1
          ? snapshot.stageWidth
          : null
        const stageCenter = isFiniteNumber(snapshot.stageCenterX)
          ? snapshot.stageCenterX
          : null
        const stageLeft = stageWidth !== null && stageCenter !== null
          ? Math.max(0, stageCenter - stageWidth / 2)
          : 0
        const stageRight = stageWidth !== null && stageCenter !== null
          ? Math.min(
            typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth,
            stageCenter + stageWidth / 2
          )
          : null
        const edgeFade = stageWidth === null
          ? 0
          : Math.max(14, Math.min(28, stageWidth * 0.035))
        const backdrop = BACKDROP_BY_KEY[snapshot.prefs.backdrop]
          ?? BACKDROP_BY_KEY[DEFAULT_PREFS.backdrop]
        const sidebarSync = snapshot.prefs.sidebarSync === true
        const bgVisible = stageWidth !== null && stageCenter !== null
        let activeLocale = null
        try {
          activeLocale = typeof locale.getLocale === 'function' ? locale.getLocale()?.active : null
        } catch {
          activeLocale = null
        }
        const currency = typeof activeLocale === 'string' && activeLocale.startsWith('zh')
          ? 'CNY'
          : 'USD'
        return h(React.Fragment, null,
          h('style', { key: 'style' }, LAYER_CSS),
          h('div', {
            key: 'layer',
            className: 'dsh-fr-layer' + (sidebarSync ? ' is-sidebar-sync' : ''),
            style: {
              '--fr-strength': String(snapshot.prefs.strength),
              '--fr-cx': stageCenter === null ? '50%' : `${stageCenter}px`,
              '--fr-stage-w': stageWidth === null ? '100vw' : `${stageWidth}px`,
              '--fr-stage-left': `${stageLeft}px`,
              '--fr-stage-right': stageRight === null ? '100vw' : `${stageRight}px`,
              '--fr-edge-fade': `${edgeFade}px`,
              '--fr-bg-cx': sidebarSync && stageCenter !== null ? `${stageCenter}px` : '50%',
              '--fr-bg-0': bgVisible ? backdrop.stops[0] : 'transparent',
              '--fr-bg-43': bgVisible ? backdrop.stops[1] : 'transparent',
              '--fr-bg-78': bgVisible ? backdrop.stops[2] : 'transparent',
            },
          },
            h('div', { className: 'dsh-fr-global', 'aria-hidden': 'true' }),
            webglFailed
              ? h('div', { className: 'dsh-fr-fallback', 'aria-hidden': 'true' })
              : h('canvas', {
                ref: canvasRef,
                className: 'dsh-fr-canvas',
                'aria-hidden': 'true',
              }),
            h('div', { className: 'dsh-fr-control', ref: wrapRef },
              sessionActive
                ? h('button', {
                  ref: triggerRef,
                  type: 'button',
                  className: 'dsh-fr-trigger' + (snapshot.running ? ' is-running' : ''),
                  'aria-label': t('settings.trigger'),
                  title: t('settings.trigger'),
                  'aria-haspopup': 'dialog',
                  'aria-expanded': open,
                  'aria-controls': open ? 'dsh-fr-settings-menu' : undefined,
                  onClick: () => setOpen((value) => !value),
                },
                  h('span', { className: 'dsh-fr-live', 'aria-hidden': 'true' }),
                  h('svg', {
                    viewBox: '0 0 20 20',
                    width: 18,
                    height: 18,
                    'aria-hidden': 'true',
                    focusable: 'false',
                  },
                    h('path', {
                      d: 'M3 5h14M3 10h14M3 15h14',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: 1.4,
                      strokeLinecap: 'round',
                    }),
                    h('circle', { cx: 7.5, cy: 5, r: 2, fill: 'currentColor' }),
                    h('circle', { cx: 12.5, cy: 10, r: 2, fill: 'currentColor' }),
                    h('circle', { cx: 8.5, cy: 15, r: 2, fill: 'currentColor' })
                  )
                )
                : null,
              open && sessionActive
                ? h(SettingsMenu, {
                  t,
                  snapshot,
                  webglFailed,
                  panelRef,
                  currency,
                  onClose: closeMenu,
                  onToggle: (key) => setPrefs({ [key]: !(snapshot.prefs[key] !== false) }),
                  onStrength: (strength) => setPrefs({ strength }),
                  onSensitivity: (sensitivity) => setPrefs({ sensitivity }),
                  onSmoothing: (smoothing) => setPrefs({ smoothing }),
                  onBackdrop: (key) => {
                    if (BACKDROP_BY_KEY[key]) setPrefs({ backdrop: key })
                  },
                  onSidebarSync: (sidebarSync) => setPrefs({ sidebarSync }),
                  onReset: () => setPrefs({ ...DEFAULT_PREFS }),
                })
                : null
            )
          )
        )
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NAMESPACE, {
            zh: DICTIONARIES.zh,
            en: DICTIONARIES.en,
          }),
          'fuel-rods: locale'
        )
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'fuel-rods-webgl',
          order: -100,
        }, createReactorLayer(ctx.locale)))
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'fuel-rods-bridge',
          order: 5,
        }, FuelBridge))
      },
    }
  },
})
