import { createBrowserRouter } from "react-router";
import { ChatLayout } from "./components/ChatLayout";
import { SettingsPage } from "./components/SettingsPage";
import { UpgradePage } from "./components/UpgradePage";
import { PersonalizationPage } from "./components/PersonalizationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ChatLayout,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
  {
    path: "/upgrade",
    Component: UpgradePage,
  },
  {
    path: "/personalization",
    Component: PersonalizationPage,
  },
]);
