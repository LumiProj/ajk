import { SearchExperience } from "@/components/SearchExperience";
import { getRollStats, loadVoters } from "@/lib/loadVoters";

export default function Home() {
  const voters = loadVoters();
  const stats = getRollStats(voters);

  return <SearchExperience voters={voters} stats={stats} />;
}
