import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Router } from './Router'
import { DefaultLayout } from './layouts/DefaultLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark">
          <DefaultLayout>
            <Router />
          </DefaultLayout>
        </div>
      </BrowserRouter>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

export default App
