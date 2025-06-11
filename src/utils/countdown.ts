export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type GameStatus = 'live' | 'about to start' | 'not started';

export function getNextWednesdayNoonET(): Date {
  const now = new Date();
  const nextWednesday = new Date(now);
  nextWednesday.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7));
  nextWednesday.setUTCHours(17, 0, 0, 0);  // Set to noon ET (17:00 UTC)
  
  // If it's already past this Wednesday noon, get next Wednesday
  if (nextWednesday <= now) {
    nextWednesday.setDate(nextWednesday.getDate() + 7);
  }
  
  return nextWednesday;
}

export function getGameStatus(): GameStatus {
  const now = new Date();
  const nextWednesday = getNextWednesdayNoonET();
  const difference = +nextWednesday - +now;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (difference > 0 && difference <= 1800000) {
    return "about to start";
  } else if (difference >= sevenDays - 1800000) {
    return "live";
  } else {
    return "not started";
  }
}

export function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const nextWednesday = getNextWednesdayNoonET();
  const difference = +nextWednesday - +now;

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
}
