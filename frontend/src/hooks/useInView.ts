import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true)
          // Uma vez visível, não precisamos mais observar
          observer.unobserve(entry.target)
        }
      })
    }, options ?? { root: null, rootMargin: '100px', threshold: 0.01 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return { ref, inView }
}
