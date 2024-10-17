import waitingSvg from "@/assets/waiting.svg";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import CountUp from "react-countup";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function TriviaGameResult() {
  const { id } = useParams();
  const gameData = useQuery(api.triviaGames.getTriviaGame, {
    gameId: (id || "") as Id<"triviaGames">,
  });

  if (!gameData) {
    return (
      <div className="grow flex items-center justify-center flex-col">
        <img src={waitingSvg} className="w-96" />
        <div className="text-3xl font-bold mt-8">Loading...</div>
      </div>
    );
  }

  const { participants } = gameData;

  // Sort participants by score in descending order
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="grow container mx-auto p-8 flex flex-col text-xl">
      <div>
        <div className="font-bold text-palette-yellow my-4">
          Game Over
        </div>
        <div className="mt-6">
          <p className="font-bold mb-2">--- Leaderboard ---</p>
          {sortedParticipants.map((participant, index) => (
            <div key={participant._id} className="flex items-center gap-4 mb-4">
              <div className="font-bold text-palette-offwhite">{index + 1}.</div>
              <div className="flex-grow">
                  <CountUp end={participant.score} duration={1} className="font-semibold  text-palette-offwhite"/> {participant.name}
              </div>
            </div>
          ))}
        </div>
        <div className="flex mt-6">
          <Link
            to="/"
            className={cn(
              buttonVariants(),
              "border-2 border-white text-white text-xl px-6 py-2 h-auto hover:bg-palette-yellow/90"
            )}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}