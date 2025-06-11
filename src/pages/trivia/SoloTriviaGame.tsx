import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function SoloTriviaGame() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<Id<"triviaGames"> | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayTime, setDisplayTime] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);

  const createSoloGame = useMutation(api.triviaGames.createSoloGame);
  const submitAnswer = useMutation(api.triviaGames.submitSoloAnswer);
  const moveToNextQuestion = useMutation(api.triviaGames.moveToNextSoloQuestion);
  
  const gameData = useQuery(
    api.triviaGames.getTriviaGame, 
    gameId ? { gameId } : "skip"
  );

  const calculateTimeLeft = () => {
    if (!gameData?.game?.questionStartedAt) {
      return 10;
    }

    const elapsed = (Date.now() - gameData.game.questionStartedAt) / 1000;

    if (gameData?.game?.isInReviewPhase) {
      // 3 second review phase
      return Math.max(0, 3 - elapsed);
    } else {
      // 10 second question phase
      return Math.max(0, 10 - elapsed);
    }
  };

  const currentQuestion = gameData?.questions?.[gameData?.game?.currentQuestionIndex];

  // Start a new game when component mounts
  useEffect(() => {
    if (!gameStarted && !gameId) {
      const startNewGame = async () => {
        try {
          const newGameId = await createSoloGame();
          setGameId(newGameId);
          setGameStarted(true);
          setError(null);
        } catch (e) {
          console.error("Error creating solo game:", e);
          setError("Failed to start the game. Please try again.");
        }
      };
      startNewGame();
    }
  }, [createSoloGame, gameStarted, gameId]);

  // Handle game completion
  useEffect(() => {
    if (gameData?.game?.status === "finished") {
      navigate(`/result/${gameId}`);
    }
  }, [gameData?.game?.status, navigate, gameId]);

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(null);
  }, [gameData?.game?.currentQuestionIndex]);

  // Timer countdown
  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setDisplayTime(Math.ceil(timeLeft));
    }, 100);

    return () => clearInterval(intervalId);
  }, [gameData?.game?.questionStartedAt, gameData?.game?.isInReviewPhase, calculateTimeLeft]);

  // Auto-advance when time runs out
  useEffect(() => {
    const timeLeft = calculateTimeLeft();

    if (timeLeft <= 0 && gameId && gameData?.game?.status === "in_progress") {
      const handleTimeUp = async () => {
        try {
          if (!gameData?.game?.isInReviewPhase) {
            // If time runs out during question phase and no answer submitted, move to review
            if (!isAnswerSubmitted) {
              await moveToNextQuestion({ gameId, showReview: true });
            }
          } else {
            // Move to next question after review phase
            await moveToNextQuestion({ gameId, showReview: false });
          }
        } catch (error) {
          console.error("Error handling time up:", error);
        }
      };

      const timeoutId = setTimeout(handleTimeUp, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [displayTime, gameId, gameData?.game?.isInReviewPhase, gameData?.game?.status, moveToNextQuestion, isAnswerSubmitted]);

  const handleSubmitAnswer = async () => {
    if (selectedAnswer && gameId && !isAnswerSubmitted && currentQuestion?._id) {
      try {
        const timeLeft = calculateTimeLeft();
        const result = await submitAnswer({
          gameId,
          questionId: currentQuestion._id,
          answer: selectedAnswer,
          timeRemaining: timeLeft,
        });
        setIsAnswerSubmitted(true);
        setIsAnswerCorrect(result.pointsEarned > 0);
        setError(null);

        // Immediately move to review phase after submitting answer
        await moveToNextQuestion({ gameId, showReview: true });
      } catch (e) {
        console.error("Error submitting answer:", e);
        setError("Failed to submit answer. Please try again.");
      }
    }
  };

  const handleSelectAnswer = (choice: string) => {
    if (!isAnswerSubmitted && !gameData?.game?.isInReviewPhase) {
      setSelectedAnswer(choice);
    }
  };

  if (!gameStarted || !gameData || !gameData.game) {
    return (
      <div className="grow flex items-center justify-center flex-col">
        <div className="text-3xl font-bold mt-8">Starting your game...</div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    );
  }

  if (gameData.game.status !== "in_progress") {
    return (
      <div className="grow flex items-center justify-center flex-col">
        <div className="text-3xl font-bold mt-8">Preparing questions...</div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="grow flex items-center justify-center flex-col">
        <div className="text-3xl font-bold mt-8">Loading question...</div>
      </div>
    );
  }

  const currentScore = gameData.participants?.[0]?.score || 0;

  return (
    <div className="container mx-auto p-8 text-xl">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="flex justify-between items-center mb-6">
        <div className="font-bold">
          Question {gameData.game.currentQuestionIndex + 1} of {gameData.questions.length}
        </div>
        <div className="font-bold">
          Score: {currentScore}
        </div>
      </div>

      <div className="my-4">
        <p className="text-2xl mb-6">{currentQuestion.questionText}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {(['A', 'B', 'C', 'D'] as const).map((choice) => (
          <Button
            key={choice}
            onClick={() => handleSelectAnswer(choice)}
            className={`w-full whitespace-normal flex items-center min-h-[60px] p-4 text-lg
              ${selectedAnswer === choice ? 'bg-palette-blue' : 'bg-palette-offwhite'}
              ${isAnswerSubmitted || gameData?.game?.isInReviewPhase ? 'opacity-50 cursor-not-allowed' : ''}
              ${gameData?.game?.isInReviewPhase && choice === currentQuestion.correctChoice ? 'bg-green-500' : ''}
              ${isAnswerSubmitted && selectedAnswer === choice && selectedAnswer !== currentQuestion.correctChoice ? 'bg-red-500' : ''}
            `}
            disabled={isAnswerSubmitted || gameData?.game?.isInReviewPhase}
          >
            <span className="font-bold mr-3">{choice}.</span>
            {currentQuestion[`choice${choice}` as keyof typeof currentQuestion]}
          </Button>
        ))}
      </div>

      {!gameData?.game?.isInReviewPhase && (
        <Button 
          onClick={handleSubmitAnswer} 
          disabled={!selectedAnswer || isAnswerSubmitted}
          className={`w-full p-6 bg-palette-yellow text-black font-bold text-xl mb-4 ${
            !selectedAnswer || isAnswerSubmitted ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Submit Answer
        </Button>
      )}

      <div className="text-center">
        <div className="text-2xl font-bold mb-2">
          Time left: {displayTime} seconds
        </div>
        
        {isAnswerSubmitted && !gameData?.game?.isInReviewPhase && (
          <div className={`font-bold text-xl ${isAnswerCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
          </div>
        )}
        
        {gameData?.game?.isInReviewPhase && (
          <div className="font-bold text-green-500 text-xl">
            Correct Answer: {currentQuestion[`choice${currentQuestion.correctChoice}` as keyof typeof currentQuestion]}
          </div>
        )}
      </div>
    </div>
  );
}
