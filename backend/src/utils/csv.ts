function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvRankingRow {
  teamName: string;
  votes: number;
  percentage: number;
}

export function buildRankingsCsv(rows: CsvRankingRow[]): string {
  const header = "Team,Votes,Percentage";
  const lines = rows.map((row) =>
    [escapeCsvField(row.teamName), escapeCsvField(row.votes), escapeCsvField(`${row.percentage.toFixed(1)}%`)].join(
      ","
    )
  );
  return [header, ...lines].join("\n") + "\n";
}
