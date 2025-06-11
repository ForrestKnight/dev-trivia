import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignInButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import CountUp from "react-countup";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function TriviaGameResult() {
  const { id } = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const gameData = useQuery(api.triviaGames.getTriviaGame, {
    gameId: (id || "") as Id<"triviaGames">,
  });

  const saveScore = useMutation(api.triviaGames.saveScoreToLeaderboard);

  const handleSaveScore = async () => {
    if (!gameData?.participants?.[0] || isSaving) return;

    setIsSaving(true);
    try {
      await saveScore({
        gameId: gameData.game._id,
        score: gameData.participants[0].score,
      });
      setScoreSaved(true);
    } catch (error) {
      console.error("Failed to save score:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
          <Authenticated>
            {!scoreSaved ? (
              <Button
                onClick={handleSaveScore}
                disabled={isSaving}
                className="bg-palette-green text-white font-bold text-xl px-8 py-4 h-auto mb-4 hover:bg-palette-green/90"
              >
                {isSaving ? "Saving..." : "Save Score to Leaderboard"}
              </Button>
            ) : (
              <div className="text-green-500 font-bold text-xl mb-4">
                Score saved to leaderboard!
              </div>
            )}
          </Authenticated>

          <Unauthenticated>
            <div className="mb-4">
              <p className="text-lg mb-3">Want to save your score to the leaderboard?</p>
              <SignInButton mode="modal">
                <Button className="bg-palette-blue text-white font-bold text-xl px-8 py-4 h-auto hover:bg-palette-blue/90">
                  Sign In to Save Score
                </Button>
              </SignInButton>
            </div>
          </Unauthenticated>
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