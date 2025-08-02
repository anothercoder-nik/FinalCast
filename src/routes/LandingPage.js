import { createRoute } from "@tanstack/react-router"
import { rootRoute } from "./routeTree.js"
import Landing from "../pages/Landing.jsx"

export const HomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Landing
})