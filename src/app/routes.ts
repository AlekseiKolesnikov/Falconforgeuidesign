import { createBrowserRouter } from "react-router";
import { Root } from "@/app/components/Root";
import { Login } from "@/app/pages/Login";
import { Feed } from "@/app/pages/Feed";
import { Profile } from "@/app/pages/Profile";
import { Messages } from "@/app/pages/Messages";
import { Opportunities } from "@/app/pages/Opportunities";
import { Events } from "@/app/pages/Events";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "feed", Component: Feed },
      { path: "profile/:id", Component: Profile },
      { path: "messages", Component: Messages },
      { path: "opportunities", Component: Opportunities },
      { path: "events", Component: Events },
    ],
  },
]);
