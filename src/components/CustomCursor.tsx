import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Custom magnetic crosshair cursor (adapted from Gist).
 *
 * Positioning strategy:
 *   - The cursor element is `position: fixed` at (0,0).
 *   - We use GSAP `left`/`top` to move the cursor's anchor point.
 *   - `xPercent: -50, yPercent: -50` keeps the visual center pinned
 *     to that anchor, so width/height changes grow symmetrically
 *     and never cause position drift.
 *   - Rotation and scale are separate transform properties that
 *     compound cleanly with the centering transform.
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null)
  const isOverTargetRef = useRef(false)
  const mousePosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const cursor = cursorRef.current
    const dot = dotRef.current
    if (!cursor || !dot) return

    const CURSOR_SIZE = 30

    // Center both elements on their anchor point
    gsap.set(cursor, { xPercent: -50, yPercent: -50 })
    gsap.set(dot, { xPercent: -50, yPercent: -50 })

    /* ------- Rotation animation ------- */
    function startRotation() {
      rotationTweenRef.current?.kill()
      rotationTweenRef.current = gsap.to(cursor, {
        rotation: '+=360',
        duration: 2.4,
        repeat: -1,
        ease: 'linear',
        transformOrigin: 'center center',
      })
    }

    function stopRotation() {
      rotationTweenRef.current?.kill()
    }

    /* ------- Global mouse move ------- */
    function onMouseMove(e: MouseEvent) {
      mousePosRef.current = { x: e.clientX, y: e.clientY }

      gsap.to(cursor, { autoAlpha: 1, duration: 0.3, overwrite: false })
      gsap.to(dot, { autoAlpha: 1, duration: 0.3, overwrite: false })

      // Only follow mouse freely when NOT hovering a target
      if (!isOverTargetRef.current) {
        gsap.to(cursor, {
          left: e.clientX,
          top: e.clientY,
          duration: 0.15,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }

      gsap.to(dot, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.08,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    /* ------- Hide cursor when leaving the window ------- */
    function onMouseLeave() {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 })
      gsap.to(dot, { autoAlpha: 0, duration: 0.3 })
    }

    /* ------- Magnetic hover on interactive elements ------- */
    const INTERACTIVE_SELECTOR =
      'a, button, [role="button"], input, textarea, .card-glow'

    function onPointerEnter(e: Event) {
      const el = e.currentTarget as HTMLElement
      isOverTargetRef.current = true
      stopRotation()

      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      // Snap position to target center AND expand to target size
      gsap.to(cursor, {
        left: cx,
        top: cy,
        width: rect.width + 12,
        height: rect.height + 12,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    function onPointerMove(e: Event) {
      const me = e as MouseEvent
      const el = me.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = me.clientX - cx
      const dy = me.clientY - cy

      // Slight magnetic offset toward the mouse within the target
      gsap.to(cursor, {
        left: cx + dx * 0.1,
        top: cy + dy * 0.1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    function onPointerLeave() {
      isOverTargetRef.current = false

      // Shrink back to default size AND return to last known mouse position
      const { x, y } = mousePosRef.current
      gsap.to(cursor, {
        left: x,
        top: y,
        width: CURSOR_SIZE,
        height: CURSOR_SIZE,
        scale: 1,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      })
      startRotation()
    }

    /* ------- Bind listeners ------- */
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    function bindInteractives() {
      const els = document.querySelectorAll(INTERACTIVE_SELECTOR)
      els.forEach((el) => {
        el.removeEventListener('mouseenter', onPointerEnter)
        el.removeEventListener('mousemove', onPointerMove)
        el.removeEventListener('mouseleave', onPointerLeave)
        el.addEventListener('mouseenter', onPointerEnter)
        el.addEventListener('mousemove', onPointerMove)
        el.addEventListener('mouseleave', onPointerLeave)
      })
    }

    bindInteractives()
    startRotation()

    // Re-bind when DOM changes, debounced to avoid thrashing
    let debounceTimer: ReturnType<typeof setTimeout>
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(bindInteractives, 100)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    /* ------- Cleanup ------- */
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      const els = document.querySelectorAll(INTERACTIVE_SELECTOR)
      els.forEach((el) => {
        el.removeEventListener('mouseenter', onPointerEnter)
        el.removeEventListener('mousemove', onPointerMove)
        el.removeEventListener('mouseleave', onPointerLeave)
      })
      rotationTweenRef.current?.kill()
      observer.disconnect()
      clearTimeout(debounceTimer)
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  )
}
