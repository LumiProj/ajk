import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import type { ElectoralRollFile, VoterRecord } from "./types";
import { normalizeCnic } from "./search";

const DATA_DIR = path.join(process.cwd(), "data");
const MERGED = "electoral_roll.json";

type VoterInFile = ElectoralRollFile["voters"][number] & {
  electoral_area?: ElectoralRollFile["electoral_area"];
};

function flattenRoll(roll: ElectoralRollFile): VoterRecord[] {
  return (roll.voters as VoterInFile[]).map((voter) => {
    const area = voter.electoral_area ?? roll.electoral_area;
    const digits = normalizeCnic(voter.cnic);
    return {
      id: `${area.number}-${voter.serial_number}-${digits}`,
      serialNumber: voter.serial_number,
      gender: voter.gender,
      name: voter.name,
      fatherName: voter.father_name,
      cnic: voter.cnic,
      cnicDigits: digits,
      occupation: voter.occupation,
      age: voter.age,
      address: voter.address,
      previousAddress: voter.previous_address,
      listPage: voter.list_page,
      areaNumber: area.number,
      areaName: area.name,
      tehsil: area.tehsil,
      district: area.district,
      constituencyCode: roll.constituency.code,
      constituencyName: roll.constituency.name,
      year: roll.year,
    };
  });
}

function dedupeByCnic(voters: VoterRecord[]): VoterRecord[] {
  const map = new Map<string, VoterRecord>();
  for (const v of voters) {
    if (!v.cnicDigits || v.cnicDigits.length !== 13) continue;
    const prev = map.get(v.cnicDigits);
    if (!prev) {
      map.set(v.cnicDigits, v);
      continue;
    }
    // Prefer records with more filled Urdu name/address
    const score = (r: VoterRecord) =>
      (r.name.ur?.length || 0) + (r.address.ur?.length || 0) + (r.age ? 2 : 0);
    if (score(v) > score(prev)) map.set(v.cnicDigits, v);
  }
  return Array.from(map.values());
}

export function loadVoters(): VoterRecord[] {
  const mergedPath = path.join(DATA_DIR, MERGED);
  if (existsSync(mergedPath)) {
    const roll = JSON.parse(readFileSync(mergedPath, "utf-8")) as ElectoralRollFile;
    return dedupeByCnic(flattenRoll(roll));
  }

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const voters: VoterRecord[] = [];
  for (const file of files) {
    const raw = readFileSync(path.join(DATA_DIR, file), "utf-8");
    const roll = JSON.parse(raw) as ElectoralRollFile;
    voters.push(...flattenRoll(roll));
  }
  return dedupeByCnic(voters);
}

export function getRollStats(voters: VoterRecord[]) {
  const areas = new Set(
    voters.map((v) => v.areaNumber).filter((n) => n && n !== "ALL"),
  );
  return {
    totalVoters: voters.length,
    totalAreas: areas.size,
  };
}
