let ctx: AudioContext | undefined

function tone(freqs: number[], step = 0.09) {
  ctx ??= new AudioContext()
  const t0 = ctx.currentTime
  freqs.forEach((f, i) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    const t = t0 + i * step
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.6)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(t)
    osc.stop(t + step * 1.8)
  })
}

// iOS Safari ignores navigator.vibrate; on iOS 18+ toggling a native switch
// input produces a light haptic tap, so use that as a fallback.
let hapticLabel: HTMLLabelElement | undefined
function haptic() {
  if ('vibrate' in navigator && navigator.vibrate(30)) return
  if (!hapticLabel) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.id = 'haptic-switch'
    hapticLabel = document.createElement('label')
    hapticLabel.htmlFor = input.id
    hapticLabel.style.display = 'none'
    hapticLabel.appendChild(input)
    document.body.appendChild(hapticLabel)
  }
  hapticLabel.click()
}

export function feedback(points: number, sound: boolean) {
  haptic()
  if (!sound) return
  try {
    if (points >= 50) tone([523, 659, 784, 1047, 1319], 0.08)
    else if (points > 0) tone(points >= 3 ? [660, 880, 1100] : [660, 880])
    else if (points < 0) tone([330, 220], 0.12)
  } catch {
    // audio unavailable
  }
}

export async function keepAwake() {
  try {
    const lock = await navigator.wakeLock?.request('screen')
    return () => lock?.release()
  } catch {
    return () => {}
  }
}
