import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./routeTree.js";
import UserSettings from "../components/settings/UserSettings.jsx";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: UserSettings
});
