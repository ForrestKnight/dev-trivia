import { Button, buttonVariants } from "@/components/ui/button";
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
        <div className="text-3xl font-bold mt-8">Loading...</div>
      </div>
    );
  }

  const { participants } = gameData;
  const playerScore = participants[0]?.score || 0;
  const correctAnswers = participants[0]?.answers?.filter(a => a.pointsEarned > 0).length || 0;
  const totalQuestions = gameData.questions.length;

  return (
    <div className="grow container mx-auto p-8 flex flex-col text-xl">
      <div className="text-center">
        <div className="font-bold text-palette-yellow my-6 text-3xl">
          🎉 Game Complete!
        </div>

        <div className="bg-palette-offwhite text-black p-6 rounded-lg mb-6">
          <div className="text-4xl font-bold mb-4">
            <CountUp end={playerScore} duration={2} /> points
          </div>
          <div className="text-xl">
            You got {correctAnswers} out of {totalQuestions} questions correct!
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-palette-blue/20 text-white p-4 rounded-lg mb-4">
            <p className="text-lg mb-2">You played as:</p>
            <p className="text-2xl font-bold text-palette-yellow">{participants[0]?.name}</p>
            <p className="text-sm mt-2 opacity-80">Look for this name on the leaderboard!</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/play">
            <Button className="bg-palette-yellow text-black font-bold text-xl px-8 py-4 h-auto hover:bg-palette-yellow/90">
              Play Again
            </Button>
          </Link>

          <Link
            to="/"
            className={cn(
              buttonVariants(),
              "border-2 border-white text-white text-xl px-8 py-4 h-auto hover:bg-palette-yellow/90"
            )}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}