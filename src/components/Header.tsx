import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";

import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="container py-4 px-16">
      <nav className="flex items-center gap-8">
        <Link className="block" to="/">
          <p className="my-2 font-extrabold uppercase">
            Dev Trivia
          </p>
        </Link>
        
        <ul className="flex ml-auto items-center">
          <li>
            <Link to="/profile">[Profile]</Link>
          </li>
        </ul>

        <div className="ml-auto">
          <Authenticated>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button className="ml-auto text-white border-2 border-white">Sign in</Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </nav>
    </header>
  );
}
