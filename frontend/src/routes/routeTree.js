import { createRootRoute } from "@tanstack/react-router"
import RootLayout from "../RootLayout.jsx"
import { HomeRoute } from "./LandingPage.js"
import { authRoute } from "./auth.route.js"
import { dashboardRoute } from "./dashboard.js"
import { contentRoute } from "./contentRoute.js"
import { createStudioRoute } from "./createStudioRoute.js"

export const rootRoute = createRootRoute({
    component: RootLayout
})

export const routeTree = rootRoute.addChildren([
    HomeRoute, 
    authRoute, 
    dashboardRoute,
    contentRoute,
    createStudioRoute
])
