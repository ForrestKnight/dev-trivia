import { InlineCountdown } from '@/components/Countdown';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../../components/ui/button";
import useStoreUser from "../../hooks/useStoreUser";

export default function TriviaLobby() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const convexUserId = useStoreUser();
  const [gameId, setGameId] = useState<Id<"triviaGames"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const joinGame = useMutation(api.triviaGames.joinTriviaGame);
  const startGame = useMutation(api.triviaGames.startTriviaGame);
  const createGame = useMutation(api.triviaGames.createTriviaGame);
  const gameData = useQuery(api.triviaGames.getTriviaGame, gameId ? { gameId } : "skip");
  const availableGame = useQuery(api.triviaGames.getAvailableGame);

  const userQuery = useQuery(api.users.getUser, clerkUser?.id ? { userId: clerkUser.id } : "skip");
  const isCreator = userQuery?.user?._id === import.meta.env.VITE_CREATOR_USER_ID;

  const joinOrCreateGame = useCallback(async () => {
    if (availableGame && !gameId) {
      try {
        await joinGame({ gameId: availableGame._id });
        setGameId(availableGame._id);
        setError(null);
      } catch (e) {
        console.error("Error joining game:", e);
        setError("Failed to join the game. Please try again.");
      }
    } else if (!availableGame && isCreator) {
      try {
        const newGameId = await createGame();
        setGameId(newGameId);
        setError(null);
      } catch (e) {
        console.error("Error creating game:", e);
        setError("Failed to create the game. Please try again.");
      }
    }
  }, [availableGame, createGame, gameId, isCreator, joinGame]);

  useEffect(() => {
    if (convexUserId && userQuery?.user && !gameId) {
      void joinOrCreateGame();
    }
  }, [joinOrCreateGame, convexUserId, userQuery, gameId]);

  useEffect(() => {
    if (gameData?.game?.status === "in_progress") {
      navigate(`/trivia-game/${gameId}`);
    }
  }, [gameData, gameId, navigate]);

  const handleStartGame = async () => {
    if (isCreator && gameId) {
        setIsStarting(true);
        try {
          await startGame({ gameId: gameId });
          navigate(`/trivia-game/${gameId}`);
        } catch (e) {
          setError("Failed to start the game. Please try again.");
          setIsStarting(false);
        }
    }
  };

  if (!convexUserId || !userQuery?.user) return <div className="container mx-auto p-8">Loading user data...</div>;
  if (!gameId) return <div className="container mx-auto p-8">Waiting to enter game lobby...</div>;
  if (!gameData) return <div className="container mx-auto p-8">Loading game data...</div>;
  if (isStarting) return <div className="container mx-auto p-8">Starting game...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-xl font-bold my-4">
        The game is about to start in: <InlineCountdown />
      </h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-4">
        <h2 className="text-xl font-bold">--- Players Waiting ---</h2>
        <ul>
          {gameData.participants?.map((participant) => (
            <li key={`${participant._id}`}>- {participant.name || 'Unnamed Player'}</li>
          ))}
        </ul>
      </div>
      {isCreator && (
        <Button onClick={handleStartGame} className="border-2 border-white text-palette-offWhite text-xl font-bold p-6" disabled={isStarting}>
          {isStarting ? 'Starting...' : 'Start Game'}
        </Button>
      )}
      {!isCreator && <p>Waiting for the game to start...</p>}
    </div>
  );
}