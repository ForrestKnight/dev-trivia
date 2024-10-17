import useStoreUser from "@/hooks/useStoreUser";
import { ReactNode, createContext } from "react";
import { Id } from "../../convex/_generated/dataModel";

export interface UserContextData {
  userId: Id<"users"> | null;
}

export const UserContext = createContext<UserContextData>({
  userId: null,
});

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const userId = useStoreUser();
  return (
    <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>
  );
};
