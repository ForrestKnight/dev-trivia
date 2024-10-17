import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../../components/ui/button";

export default function TriviaGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingTimeUp = useRef(false);

  const gameData = useQuery(api.triviaGames.getTriviaGame, 
    id ? { gameId: id as Id<"triviaGames"> } : "skip"
  );
  const submitAnswer = useMutation(api.triviaGames.submitAnswer);
  const moveToNextQuestion = useMutation(api.triviaGames.moveToNextQuestion);

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
  }, [gameData, navigate, id]);

  useEffect(() => {
    setTimeLeft(10);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsAnswerCorrect(null);
    setShowCorrectAnswer(false);
    setIsReviewPhase(false);
    isHandlingTimeUp.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [gameData?.game?.currentQuestionIndex]);

  useEffect(() => {
    if (timeLeft > 0) {
      timeoutRef.current = setTimeout(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (!isHandlingTimeUp.current) {
      handleTimeUp();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeLeft]);

  const handleTimeUp = async () => {
    if (isHandlingTimeUp.current) return;
    isHandlingTimeUp.current = true;

    try {
      if (!isReviewPhase) {
        if (!isAnswerSubmitted) {
          await handleSubmitAnswer();
        }
        setIsReviewPhase(true);
        setShowCorrectAnswer(true);
        setTimeLeft(3);
      } else {
        await moveToNextQuestion({ gameId: id as Id<"triviaGames"> });
        setIsReviewPhase(false);
        setTimeLeft(10);
      }
    } catch (error) {
      console.error("Error in handleTimeUp:", error);
    } finally {
      isHandlingTimeUp.current = false;
    }
  };

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
    if (!isAnswerSubmitted && !isReviewPhase) {
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
      <div className="mb-2">
        {(['A', 'B', 'C', 'D'] as const).map((choice) => (
          <Button
            key={choice}
            onClick={() => handleSelectAnswer(choice)}
            className={`mr-2 mb-2 p-4 
              ${selectedAnswer === choice ? 'bg-palette-blue' : 'bg-palette-offwhite'}
              ${isAnswerSubmitted || isReviewPhase ? 'opacity-50 cursor-not-allowed' : ''}
              ${showCorrectAnswer && choice === currentQuestion.correctChoice ? 'bg-green-500' : ''}
              ${isAnswerSubmitted && selectedAnswer === choice && selectedAnswer !== currentQuestion.correctChoice ? 'bg-red-500' : ''}
            `}
            disabled={isAnswerSubmitted || isReviewPhase}
          >
            {currentQuestion[`choice${choice}` as keyof typeof currentQuestion]}
          </Button>
        ))}
      </div>
      <Button 
        onClick={handleSubmitAnswer} 
        disabled={!selectedAnswer || isAnswerSubmitted || isReviewPhase}
        className={`p-6 bg-palette-offwhite ${isAnswerSubmitted || isReviewPhase ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Submit Answer
      </Button>
      <div className="mt-4">Time left: {timeLeft} seconds</div>
      {isAnswerSubmitted && !isReviewPhase && (
        <div className={`mt-4 font-bold ${isAnswerCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
        </div>
      )}
      {isReviewPhase && (
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