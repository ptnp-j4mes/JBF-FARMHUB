export interface FeedProgramDayDto {
  id: number;
  programId: number;
  feedCode: string;
  dayFrom: number;
  dayTo: number;
  durationDays: number;
  kgPerHead: number;
  sortOrder: number;
  isActive: boolean;
  createdDate: string;
}

export interface FeedProgramDto {
  id: number;
  programCode: string;
  programName: string;
  totalDays: number;
  totalKgPerHead: number;
  fcr: number;
  adgGramsPerDay: number;
  sortOrder: number;
  isActive: boolean;
  createdDate: string;
  days: FeedProgramDayDto[];
}

export interface FeedProgramDayUpsert {
  id?: number | null;
  feedCode: string;
  dayFrom: number;
  dayTo: number;
  durationDays: number;
  kgPerHead: number;
  sortOrder: number;
  isActive: boolean;
}

export interface FeedProgramUpsert {
  programCode: string;
  programName: string;
  totalDays: number;
  totalKgPerHead: number;
  fcr: number;
  adgGramsPerDay: number;
  sortOrder: number;
  isActive: boolean;
  days: FeedProgramDayUpsert[];
}
