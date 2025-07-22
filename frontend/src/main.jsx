
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routes/routetree.js'
// import { Provider } from 'react-redux'
// import { store } from './store/store.js'

export const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context:{
    queryClient,
  }
})

createRoot(document.getElementById('root')).render(
 
     <Provider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </Provider>

)