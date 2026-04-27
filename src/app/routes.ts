import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "../app/pages/Login";
import { Feed } from "../app/pages/Feed";
import { Profile } from "../app/pages/Profile";
import { Opportunities } from "../app/pages/Opportunities";
import { Events } from "../app/pages/Events";
import { Organization } from "../app/pages/Organization";
import { Groups } from "../app/pages/Groups";
import { Network } from "../app/pages/Network";
import { Connections } from "../app/pages/Connections";
import { SavedItems } from "../app/pages/SavedItmes";
import { Search } from "../app/pages/Search"; // <-- Add this import

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "feed", Component: Feed },
      { path: "profile/:id", Component: Profile },
      { path: "organization/:id", Component: Organization },
      { path: "groups", Component: Groups },
      { path: "opportunities", Component: Opportunities },
      { path: "network", Component: Network },
      { path: "events", Component: Events },
      { path: "connections", Component: Connections },
      { path: "saved", Component: SavedItems },
      { path: "search", Component: Search }, // <-- Add the search route here
    ],
  },
]);