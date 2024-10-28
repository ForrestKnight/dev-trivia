import { useQuery } from "convex/react";
import CountUp from "react-countup";
import { api } from "../convex/_generated/api";
import CountdownTimer from "./components/Countdown";

export default function App() {
  const recentLeaderboard = useQuery(api.triviaGames.getMostRecentGameLeaderboard);

  return (
    <div className="grow container mx-auto p-8 flex flex-col">
      <div className="text-left mb-4 text-xl">
        <p className="mt-4 font-extrabold uppercase">
          Dev Trivia
        </p>
        <p>
          Test your coding knowledge and compete with fellow developers in our weekly live trivia game! Every Wednesday at 12pm ET, join us for 10 rounds of brain-teasing questions covering everything from programming languages to computer science fundamentals. Climb the leaderboard, learn something new, and have fun with the dev community!
        </p>
      </div>
      
      <div className="gap-4 mb-4">
        <CountdownTimer />
        <p className="text-xl mt-4 mb-2 stretch-min tracking-tight font-bold">
          --- How It Works ---
        </p>
        <p className="text-xl leading-5 tracking-tight">
          Dev Trivia is a weekly, live trivia game. All players will be asked the same question at the same time and given 20 seconds to answer it. Every correct answer scores points based on how much time is left in the round - the quicker you answer (correctly), the more points you get. Climb the leadserboard, compete with fellow developers, and have a good time doing it!
        </p>
      </div>
      <div className="gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">--- Last Week's Leaderboard ---</h2>
          {recentLeaderboard ? (
            recentLeaderboard.map((participant, index) => (
              <div key={index} className="flex items-center gap-4 mb-1">
                <div className="text-xl font-bold text-palette-offwhite">{index + 1})</div>
                <div className="flex-grow">
                  <div className="text-xl">
                    <CountUp end={participant.score} duration={1} className="font-semibold  text-palette-offwhite"/> {participant.name}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No recent games found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
