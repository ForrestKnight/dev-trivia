import { UserContext } from "@/contexts/UserContext";
import { useContext } from "react";

export const useUser = () => {
  const context = useContext(UserContext);

  return context;
};
