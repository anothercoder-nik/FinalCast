import { ReactLenis } from 'lenis/react'
import { useEffect, useRef } from 'react'
import Hero from '../components/Hero'

function App() {
  const lenisRef = useRef()

  useEffect(() => {
    function update(time) {
      lenisRef.current?.lenis?.raf(time)
      requestAnimationFrame(update)
    }

    const rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
        <Hero />
      </ReactLenis>
    </>
  )
}

export default App
