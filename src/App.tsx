import { useEffect, useRef } from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import CluelyUI from "./_pages/CluelyUI"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, cacheTime: Infinity } }
})

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight
      const width = containerRef.current.scrollWidth
      window.electronAPI?.invoke("update-content-dimensions", { width, height })
    }

    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    updateSize()

    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      <QueryClientProvider client={queryClient}>
        <CluelyUI />
      </QueryClientProvider>
    </div>
  )
}

export default App