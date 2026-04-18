export interface FileData {
  path: string;
  purpose: string;
  importance: number;
}

export interface SummaryData {
  description: string;
  techStack: string[];
  entryPoints: string[];
}

export interface RepoData {
  id: string;
  summary: SummaryData;
  topFiles: FileData[];
  flow?: string;
}