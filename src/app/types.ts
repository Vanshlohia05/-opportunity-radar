export type OpportunityType = 'internship' | 'fellowship' | 'apprenticeship' | 'scholarship';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  location: string | null;
  region: string | null;
  remote: boolean;
  url: string;
  deadline: string | null;
  postedDate: string | null;
  source: string;
  sourceName: string;
  tags: string[];
  description: string | null;
  firstSeen: string;
  lastSeen: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  url: string;
  error?: string;
}

export interface DatasetMeta {
  generatedAt: string;
  total: number;
  counts: Record<OpportunityType, number>;
  sources: SourceStatus[];
  ttlDays: number;
}

export interface Dataset {
  meta: DatasetMeta;
  opportunities: Opportunity[];
}
