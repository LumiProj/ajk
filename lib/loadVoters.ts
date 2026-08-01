import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { ElectoralRollFile, VoterRecord } from "./types";
import { normalizeCnic } from "./search";

const DATA_DIR = path.join(process.cwd(), "data");

function flattenRoll(roll: ElectoralRollFile): VoterRecord[] {
  return roll.voters.map((voter) => ({
    id: `${roll.electoral_area.number}-${voter.serial_number}-${normalizeCnic(voter.cnic)}`,
    serialNumber: voter.serial_number,
    gender: voter.gender,
    name: voter.name,
    fatherName: voter.father_name,
    cnic: voter.cnic,
    cnicDigits: normalizeCnic(voter.cnic),
    occupation: voter.occupation,
    age: voter.age,
    address: voter.address,
    previousAddress: voter.previous_address,
    listPage: voter.list_page,
    areaNumber: roll.electoral_area.number,
    areaName: roll.electoral_area.name,
    tehsil: roll.electoral_area.tehsil,
    district: roll.electoral_area.district,
    constituencyCode: roll.constituency.code,
    constituencyName: roll.constituency.name,
    year: roll.year,
  }));
}

export function loadVoters(): VoterRecord[] {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const voters: VoterRecord[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(DATA_DIR, file), "utf-8");
    const roll = JSON.parse(raw) as ElectoralRollFile;
    voters.push(...flattenRoll(roll));
  }

  return voters;
}

export function getRollStats(voters: VoterRecord[]) {
  const areas = new Set(voters.map((v) => v.areaNumber));
  return {
    totalVoters: voters.length,
    totalAreas: areas.size,
  };
}
