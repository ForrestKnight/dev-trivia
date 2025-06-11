import { useQuery } from "convex/react";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import { api } from "../convex/_generated/api";

export default function App() {
  const recentLeaderboard = useQuery(api.triviaGames.getMostRecentGameLeaderboard);

  return (
    <div className="grow container mx-auto p-8 flex flex-col">
      <div className="text-left mb-6 text-xl">
        <p className="mt-4 font-extrabold uppercase text-2xl">
          Dev Trivia
        </p>
        <p className="mt-4">
          Test your coding knowledge with our on-demand trivia game! Jump in anytime for 10 rounds of brain-teasing questions covering everything from programming languages to computer science fundamentals. Answer quickly to earn more points - the faster you respond correctly, the higher your score!
        </p>
      </div>

      <div className="mb-6">
        <Link to="/play">
          <Button className="bg-palette-yellow text-black font-bold text-2xl px-8 py-6 hover:bg-palette-yellow/90">
            Start Playing Now
          </Button>
        </Link>
      </div>

      <div className="gap-4 mb-4">
        <p className="text-xl mt-4 mb-2 stretch-min tracking-tight font-bold">
          --- How It Works ---
        </p>
        <p className="text-xl leading-6 tracking-tight mb-4">
          • 10 multiple-choice questions about programming and computer science<br/>
          • 20 seconds per question - answer quickly for more points<br/>
          • No login required to play, but sign in to save your score to the leaderboard<br/>
          • Play as many times as you want, whenever you want!
        </p>
        <div className="text-xs italic mt-4 mb-4">
          Dev Trivia used to be a weekly, live trivia game where all players answered the same questions simultaneously every Wednesday at 12pm ET. Thanks for your patience as we transitioned to this new on-demand format! - Forrest
        </div>
      </div>
      <div className="gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">--- Recent High Scores ---</h2>
          {recentLeaderboard ? (
            recentLeaderboard.slice(0, 10).map((participant, index) => (
              <div key={index} className="flex items-center gap-4 mb-1">
                <div className="text-xl font-bold text-palette-offwhite">{index + 1})</div>
                <div className="flex-grow">
                  <div className="text-xl">
                    <CountUp end={participant.score} duration={1} className="font-semibold text-palette-offwhite"/> {participant.name}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No games played yet. Be the first to play!</p>
          )}
        </div>
      </div>
    </div>
  );
}
