import { getCompetitorReports } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatUpdatedAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CompetitorsPage() {
  const reports = getCompetitorReports();

  return (
    <div className="px-6 py-5 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl heading-page text-text-primary leading-tight">
          Competitors
        </h1>
        {reports.length > 0 && (
          <span className="text-sm text-text-tertiary tabular">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-base text-text-secondary">No competitor data.</p>
          <p className="text-sm text-text-tertiary mt-1">
            Add a <code className="font-mono text-sm text-text-secondary bg-bg px-1 py-0.5 rounded">research-report.md</code> or competitor data file to a startup project to render real analysis here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => {
            const table = report.table;

            return (
              <section
                key={`${report.startupId}:${report.reportPath}`}
                className="border border-border-subtle rounded-md overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border-subtle bg-surface">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-md font-semibold text-text-primary">
                    {report.startupName}
                  </h2>
                  <span className="text-2xs font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg text-text-tertiary">
                    {report.startupType}
                  </span>
                  <span className="ml-auto text-xs text-text-tertiary tabular">
                    Updated {formatUpdatedAt(report.updatedAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-5">
                  {report.summary}
                </p>
                <p className="text-xs text-text-tertiary font-mono mt-2">
                  {report.reportPath}
                </p>
              </div>

                <div className="px-4 py-4 space-y-4">
                  {report.weaknesses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-2">
                        Market Weaknesses
                      </h3>
                      <ul className="space-y-1">
                        {report.weaknesses.map((weakness) => (
                          <li
                            key={weakness}
                            className="text-sm text-text-secondary leading-5"
                          >
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {table ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]">
                        <thead>
                          <tr className="border-b border-border text-left">
                            {table.headers.map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, index) => (
                            <tr
                              key={`${report.startupId}:${report.reportPath}:${index}`}
                              className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                            >
                              {table.headers.map((header) => (
                                <td
                                  key={`${header}:${index}`}
                                  className="px-3 py-2.5 text-sm text-text-secondary align-top"
                                >
                                  {row[header] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-border-subtle rounded-md px-4 py-4">
                      <p className="text-sm text-text-secondary">
                        Report found, but no structured competitor table was detected.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
