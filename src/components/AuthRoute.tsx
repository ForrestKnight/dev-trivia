import { useUser } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

export default function AuthRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && !isSignedIn) return <Navigate to="/" />;
  return children;
}
