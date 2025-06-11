import { Unauthenticated } from 'convex/react';
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { calculateTimeLeft, getGameStatus, type GameStatus, type TimeLeft } from '../utils/countdown';

interface CountdownProps {
  onGameStatusChange?: (status: GameStatus) => void;
}

const Countdown: React.FC<CountdownProps> = ({ onGameStatusChange }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [gameStatus, setGameStatus] = useState<GameStatus>(getGameStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      const newGameStatus = getGameStatus();
      if (newGameStatus !== gameStatus) {
        setGameStatus(newGameStatus);
        if (onGameStatusChange) {
          onGameStatusChange(newGameStatus);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, onGameStatusChange]);

  const addLeadingZero = (value: number): string => {
    return value < 10 ? `0${value}` : value.toString();
  }

  return (
    <div className="mb-4 flex flex-col">
      <div className="mb-2 text-xl font-semibold">
        {gameStatus === 'live' && "--- Game is live! ---"}
        {gameStatus === 'about to start' && "--- Game is about to start ---"}
        {gameStatus === 'not started' && "--- Next game starts in ---"}
      </div>
      <div className="w-fit border-2 border-white text-white px-6 py-3">
        <div className="flex items-center space-x-1">
          {(Object.keys(timeLeft) as Array<keyof TimeLeft>).map((interval, index, array) => (
            <React.Fragment key={String(interval)}>
               <div className="text-center">
                  <div className="text-4xl font-bold">
                     {addLeadingZero(timeLeft[interval])}
                  </div>
                  <div className="text-xs uppercase">{String(interval)}</div>
               </div>
               {index < array.length - 1 && (
                  <div className="text-2xl font-bold self-start mt-1">:</div>
               )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {(gameStatus === 'live' || gameStatus === 'about to start') && (
        <>
          <Link
            to="/trivia-lobby"
            className="w-fit mt-4 border-2 border-white py-4 px-8 hover:bg-palette-green/90 flex flex-col"
          >
            <div className="text-xl font-bold text-center">Join the Game</div>
          </Link>
          <Unauthenticated>
            <p className="text-palette-yellow font-bold mt-2">You must be signed in to play.</p>
          </Unauthenticated>
        </>
      )}
    </div>
  );
};

export default Countdown;

// InlineCountdown component
const InlineCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [gameStatus, setGameStatus] = useState<GameStatus>(getGameStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      const newGameStatus = getGameStatus();
      if (newGameStatus !== gameStatus) {
        setGameStatus(newGameStatus);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  if (gameStatus === 'live') {
    return <span className="text-palette-yellow">The game is live now!</span>;
  }

  if (gameStatus === 'about to start') {
    return <span className="text-palette-yellow">{`${timeLeft.minutes}m ${timeLeft.seconds}s`}</span>;
  }

  return (
    <span className="text-palette-yellow">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </span>
  );
};

export { InlineCountdown };
