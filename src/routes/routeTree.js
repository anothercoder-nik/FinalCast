import { createRootRoute } from "@tanstack/react-router"
import RootLayout from "../RootLayout.jsx"
import { HomeRoute } from "./LandingPage.js"
import { authRoute } from "./auth.route.js"
import { dashboardRoute } from "./dashboard.js"
import { contentRoute } from "./contentRoute.js"
import { createStudioRoute } from "./createStudioRoute.js"
import { studiosRoute } from "./studiosRoute.js"
import { JoinRoute } from "./joinStudio.js"
import { studioRoomRoute } from "./studioRoomRoute.js"
import { sessionDetailsRoute } from "./sessionDetailsRoute.js"
import { settingsRoute } from "./settingsRoute.js"

const NotFound = () => (
  <div className="min-h-screen bg-stone-950 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
      <p className="text-stone-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/studios" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
        Go to Studios
      </a>
    </div>
  </div>
);

export const rootRoute = createRootRoute({
    component: RootLayout,
    notFoundComponent: NotFound
})

export const routeTree = rootRoute.addChildren([
    HomeRoute, 
    authRoute, 
    dashboardRoute,
    contentRoute,
    createStudioRoute,
    studiosRoute,
    JoinRoute,
    studioRoomRoute,
    sessionDetailsRoute,
    settingsRoute
])
