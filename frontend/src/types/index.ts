export interface FileData {
  path: string;
  purpose: string;
  importance: number;
}

export interface SummaryData {
  total: number;
  topFiles: FileData[];
}