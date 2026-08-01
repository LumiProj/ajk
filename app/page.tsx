import { SearchExperience } from "@/components/SearchExperience";
import { loadVoters } from "@/lib/loadVoters";

export default function Home() {
  const voters = loadVoters();

  return <SearchExperience voters={voters} />;
}
