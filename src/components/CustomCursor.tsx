import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Custom magnetic crosshair cursor (adapted from Gist).
 * - Crosshair frame follows the mouse with a slight delay
 * - Center dot tracks mouse precisely
 * - Grows to envelope interactive elements on hover (magnetic effect)
 * - Colors adapt to light/dark theme via CSS variables
 * - Hidden on touch devices via CSS media query
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null)
  const isOverTargetRef = useRef(false)

  useEffect(() => {
    const cursor = cursorRef.current
    const dot = dotRef.current
    if (!cursor || !dot) return

    const CURSOR_SIZE = 30
    const DOT_SIZE = 7

    /* ------- Rotation animation ------- */
    function startRotation() {
      gsap.set(cursor, { rotation: 0 })
      rotationTweenRef.current = gsap.to(cursor, {
        rotation: 180,
        duration: 1.2,
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
      gsap.to(cursor, { autoAlpha: 1 })
      gsap.to(dot, { autoAlpha: 1 })

      if (!isOverTargetRef.current) {
        gsap.to(cursor, {
          x: e.clientX - CURSOR_SIZE / 2,
          y: e.clientY - CURSOR_SIZE / 2,
          duration: 0.15,
          ease: 'expo.out',
        })
      }

      gsap.to(dot, {
        x: e.clientX - DOT_SIZE / 2,
        y: e.clientY - DOT_SIZE / 2,
        duration: 0.1,
        ease: 'expo.out',
      })
    }

    /* ------- Hide cursor when leaving the window ------- */
    function onMouseLeave() {
      gsap.to(cursor, { autoAlpha: 0 })
      gsap.to(dot, { autoAlpha: 0 })
    }

    /* ------- Magnetic hover on interactive elements ------- */
    const INTERACTIVE_SELECTOR =
      'a, button, [role="button"], input, textarea, .card-glow'

    function onPointerEnter(e: Event) {
      const el = e.currentTarget as HTMLElement
      isOverTargetRef.current = true
      stopRotation()

      const rect = el.getBoundingClientRect()
      gsap.to(cursor, {
        width: rect.width + 8,
        height: rect.height + 8,
        rotation: 360,
        duration: 0.25,
        ease: 'power2.out',
      })
    }

    function onPointerMove(e: Event) {
      const el = (e as MouseEvent).currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const me = e as MouseEvent
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = me.clientX - cx
      const dy = me.clientY - cy

      gsap.to(cursor, {
        x: rect.left - 4 + dx * 0.08,
        y: rect.top - 4 + dy * 0.08,
        scale: 1.05,
        duration: 0.15,
        ease: 'power2.out',
      })
    }

    function onPointerLeave() {
      isOverTargetRef.current = false
      gsap.to(cursor, {
        width: CURSOR_SIZE,
        height: CURSOR_SIZE,
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, .9)',
      })
      startRotation()
    }

    /* ------- Bind listeners ------- */
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    const interactives = document.querySelectorAll(INTERACTIVE_SELECTOR)
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onPointerEnter)
      el.addEventListener('mousemove', onPointerMove)
      el.addEventListener('mouseleave', onPointerLeave)
    })

    startRotation()

    /* ------- Re-bind when DOM changes (for dynamic content) ------- */
    const observer = new MutationObserver(() => {
      const newInteractives = document.querySelectorAll(INTERACTIVE_SELECTOR)
      newInteractives.forEach((el) => {
        el.removeEventListener('mouseenter', onPointerEnter)
        el.removeEventListener('mousemove', onPointerMove)
        el.removeEventListener('mouseleave', onPointerLeave)
        el.addEventListener('mouseenter', onPointerEnter)
        el.addEventListener('mousemove', onPointerMove)
        el.addEventListener('mouseleave', onPointerLeave)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    /* ------- Cleanup ------- */
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onPointerEnter)
        el.removeEventListener('mousemove', onPointerMove)
        el.removeEventListener('mouseleave', onPointerLeave)
      })
      rotationTweenRef.current?.kill()
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  )
}
