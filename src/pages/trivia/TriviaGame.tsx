import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../../components/ui/button";

export default function TriviaGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayTime, setDisplayTime] = useState(20);

  const gameData = useQuery(api.triviaGames.getTriviaGame, 
    id ? { gameId: id as Id<"triviaGames"> } : "skip"
  );
  const submitAnswer = useMutation(api.triviaGames.submitAnswer);
  const moveToNextQuestion = useMutation(api.triviaGames.moveToNextQuestion);
  const moveToReviewPhase = useMutation(api.triviaGames.moveToReviewPhase);

  const calculateTimeLeft = () => {
    if (!gameData?.game?.questionStartedAt) return 20;

    const now = Date.now();
    const elapsed = (now - gameData.game.questionStartedAt) / 1000;

    if (gameData.game.isInReviewPhase) {
      return Math.max(0, 3 - elapsed);
    }
    return Math.max(0, 20 - elapsed);
  }

  const timeLeft = calculateTimeLeft();
  const isHost = gameData?.game?.hostUserId === import.meta.env.VITE_CREATOR_USER_ID;

  useEffect(() => {
    if (!id) {
      navigate('/trivia-lobby');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (gameData?.game?.status === "waiting") {
        navigate('/trivia-lobby'); 
    }
    if (gameData?.game?.status === "finished") {
        navigate(`/trivia-game/result/${id}`);
    }
  }, [gameData?.game?.status, navigate, id]);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(null);
  }, [gameData?.game?.currentQuestionIndex]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setDisplayTime(Math.ceil(timeLeft));
    }, 100);

    return () => clearInterval(intervalId);
  }, [gameData?.game?.questionStartedAt, gameData?.game?.isInReviewPhase, calculateTimeLeft])

  useEffect(() => {
    if (!isHost) return;

    const timeLeft = calculateTimeLeft();

    const handleTimeUp = async () => {
      if (timeLeft > 0) return;

      try {
        if (!gameData?.game?.isInReviewPhase) {
          await moveToReviewPhase({ gameId: id as Id<"triviaGames"> });
        } else {
          await moveToNextQuestion({ gameId: id as Id<"triviaGames"> });
        }
      } catch (error) {
        console.error("Error handling time up:", error);        
      }
    }

    handleTimeUp();
    
  }, [timeLeft, gameData?.game?.isInReviewPhase, isHost, moveToReviewPhase, id, moveToNextQuestion, calculateTimeLeft]);

  const handleSubmitAnswer = async () => {
    if (selectedAnswer && id && !isAnswerSubmitted && currentQuestion?._id) {
      try {
        const result = await submitAnswer({
          gameId: id as Id<"triviaGames">,
          questionId: currentQuestion._id,
          answer: selectedAnswer,
          timeRemaining: timeLeft,
        });
        setIsAnswerSubmitted(true);
        setIsAnswerCorrect(result.pointsEarned > 0);
        setError(null);
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

  if (!id || !gameData || !gameData.game) {
    return <div>Loading game data...</div>;
  }

  if (gameData.game.status !== "in_progress") {
    return <div>Waiting for the game to start...</div>;
  }

  const currentQuestion = gameData.questions[gameData.game.currentQuestionIndex];

  if (!currentQuestion) {
    return <div>No question available</div>;
  }

  return (
    <div className="container mx-auto p-8 text-xl">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="my-4">
        <h2 className="font-bold mb-4">--- Question {gameData.game.currentQuestionIndex + 1} ---</h2>
        <p>{currentQuestion.questionText}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-4">
        {(['A', 'B', 'C', 'D'] as const).map((choice) => (
          <Button
            key={choice}
            onClick={() => handleSelectAnswer(choice)}
            className={`w-full whitespace-normal flex items-center min-h-[60px] p-4 text-sm sm:text-xl
              ${selectedAnswer === choice ? 'bg-palette-blue' : 'bg-palette-offwhite'}
              ${isAnswerSubmitted || gameData?.game?.isInReviewPhase ? 'opacity-50 cursor-not-allowed' : ''}
              ${gameData?.game?.isInReviewPhase && choice === currentQuestion.correctChoice ? 'bg-green-500' : ''}
              ${isAnswerSubmitted && selectedAnswer === choice && selectedAnswer !== currentQuestion.correctChoice ? 'bg-red-500' : ''}
            `}
            disabled={isAnswerSubmitted || gameData?.game?.isInReviewPhase}
          >
            {currentQuestion[`choice${choice}` as keyof typeof currentQuestion]}
          </Button>
        ))}
      </div>
      <Button 
        onClick={handleSubmitAnswer} 
        disabled={!selectedAnswer || isAnswerSubmitted || gameData?.game?.isInReviewPhase}
        className={`p-6 bg-palette-offwhite ${isAnswerSubmitted || gameData?.game?.isInReviewPhase ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Submit Answer
      </Button>
      <div className="mt-4">Time left: {displayTime} seconds</div>
      {isAnswerSubmitted && !gameData?.game?.isInReviewPhase && (
        <div className={`mt-4 font-bold ${isAnswerCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
        </div>
      )}
      {gameData?.game?.isInReviewPhase && (
        <div className="mt-4 font-bold text-green-500">
          Correct Answer: {currentQuestion[`choice${currentQuestion.correctChoice}` as keyof typeof currentQuestion]}
        </div>
      )}
      <div className="mt-4">
        <h3>Participants:</h3>
        <ul>
          {gameData.participants.map((participant) => (
            <li key={participant._id}>{participant.name} - Score: {participant.score}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}