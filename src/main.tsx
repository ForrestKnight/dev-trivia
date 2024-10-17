import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import AuthRoute from "./components/AuthRoute";
import MainLayout from "./components/layout/MainLayout";
import { Toaster } from "./components/ui/toaster";
import { UserContextProvider } from "./contexts/UserContext";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";
import ErrorPage from "./pages/ErrorPage";
import Profile from "./pages/Profile";
import TriviaGame from "./pages/trivia/TriviaGame";
import TriviaLobby from "./pages/trivia/TriviaLobby";
import TriviaGameResult from "./pages/trivia/TriviaResult";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <App />,
      },
      {
        path: "profile",
        element: (
          <AuthRoute>
            <Profile />
          </AuthRoute>
        ),
      },
      {
        path: "trivia-lobby",
        element: (
          <AuthRoute>
            <TriviaLobby />
          </AuthRoute>
        ),
      },
      {
        path: "trivia-game/:id",
        element: (
          <AuthRoute>
            <TriviaGame />
          </AuthRoute>
        ),
      },
      {
        path: "trivia-game/result/:id",
        element: <TriviaGameResult />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <UserContextProvider>
            <RouterProvider router={router} />
          </UserContextProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ErrorBoundary>
    <Toaster />
  </React.StrictMode>
);
