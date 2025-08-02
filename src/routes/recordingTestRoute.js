import { createRoute } from "@tanstack/react-router"
import { rootRoute } from "./routeTree.js"
import RecordingTest from "../components/debug/RecordingTest.jsx"

export const recordingTestRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/recording-test',
    component: RecordingTest
})
