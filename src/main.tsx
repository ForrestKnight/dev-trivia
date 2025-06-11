import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Analytics } from "@vercel/analytics/react";
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
import SoloTriviaGame from "./pages/trivia/SoloTriviaGame";
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
        path: "play",
        element: <SoloTriviaGame />,
      },
      {
        path: "result/:id",
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
            <Analytics />
            <RouterProvider router={router} />
          </UserContextProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ErrorBoundary>
    <Toaster />
  </React.StrictMode>
);
