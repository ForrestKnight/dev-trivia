import { Separator } from "@/components/ui/separator";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Profile() {
  const auth = useUser();
  const userHistories = useQuery(api.users.getUserHistories);

  if (!auth.user || !userHistories) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="grow container mx-auto p-8 flex flex-col gap-4">
      <div className="space-y-4">
        {/* User Profile Section */}
        <div className="bg-palette-offwhite p-6 text-black">
          <div className="flex gap-4">
            <div>
              <img src={auth.user.imageUrl} className="w-32 rounded-full" alt="Profile" />
            </div>
            <div className="grow">
              <div className="text-3xl font-bold">{auth.user.fullName}</div>
              <div className="mt-4 space-y-2">
                <div>
                  <div className="text-muted-foreground text-sm">Email</div>
                  <div>{auth.user.emailAddresses[0]?.emailAddress}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trivia Game History Section */}
        <div className="bg-palette-offwhite p-6 text-black">
          <h2 className="text-2xl font-bold">Dev Trivia History</h2>
          <Separator className="my-4" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Questions Answered</th>
                  <th className="p-2">Correct Answers</th>
                </tr>
              </thead>
              <tbody>
                {userHistories.triviaParticipations?.map((participation) => {
                  const correctAnswers = participation.answers.filter(a => a.pointsEarned > 0).length;
                  return (
                    <tr key={participation._id} className="border-t">
                      <td className="p-2">{new Date(participation._creationTime).toLocaleDateString()}</td>
                      <td className="p-2">{participation.score}</td>
                      <td className="p-2">{participation.answers.length}</td>
                      <td className="p-2">{correctAnswers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}