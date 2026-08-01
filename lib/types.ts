export type LocalizedString = {
  ur: string;
  en: string;
};

export type ElectoralRollFile = {
  source_file: string;
  document_type: string;
  year: number;
  context: LocalizedString;
  authority: LocalizedString;
  constituency: {
    code: string;
    name: LocalizedString;
  };
  electoral_area: {
    number: string;
    name: LocalizedString;
    mauza: LocalizedString;
    patwar_circle: LocalizedString;
    tehsil: LocalizedString;
    district: LocalizedString;
  };
  publication_date: {
    ur: string;
    iso: string;
  };
  voter_summary: {
    male: number;
    female: number;
    total: number;
  };
  voters: Array<{
    serial_number: number;
    gender: "male" | "female";
    name: LocalizedString;
    father_name: LocalizedString;
    cnic: string;
    occupation: LocalizedString;
    age: number;
    address: LocalizedString;
    previous_address: LocalizedString;
    list_page: string;
  }>;
};

export type VoterRecord = {
  id: string;
  serialNumber: number;
  gender: "male" | "female";
  name: LocalizedString;
  fatherName: LocalizedString;
  cnic: string;
  cnicDigits: string;
  occupation: LocalizedString;
  age: number;
  address: LocalizedString;
  previousAddress: LocalizedString;
  listPage: string;
  areaNumber: string;
  areaName: LocalizedString;
  tehsil: LocalizedString;
  district: LocalizedString;
  constituencyCode: string;
  constituencyName: LocalizedString;
  year: number;
};

export type Lang = "ur" | "en";
