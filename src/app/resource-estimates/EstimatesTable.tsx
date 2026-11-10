import { REPORT_ISSUE_URL, T_GATES_PER_TOFFOLI } from "@/lib/resource-estimates/config";
import type { ChartData, Point } from "@/lib/resource-estimates/data";

export function EstimatesTable({ points, areas }: { points: Point[]; areas: ChartData["areas"] }) {
  const byArea = new Map(areas.map((a) => [a.match, a]));
  const rows = [...points].sort((a, b) => a.area.localeCompare(b.area) || a.gates - b.gates);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-[614px] flex-col gap-2">
        <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
          Quantum algorithm resource estimates ({rows.length})
        </h2>
        <p className="text-sm text-text-secondary">
          This evolving collection highlights research progress and the quantum computing resources
          needed to support it. To report a bug or data discrepancy,{" "}
          <a
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-70 underline hover:no-underline"
          >
            submit an issue
          </a>
          .
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-text-secondary border-b border-border-subtle">
            <tr>
              {["Area", "Problem", "Qubits", "Operations", "Year", "Reference"].map((h) => (
                <th key={h} scope="col" className="py-2 pr-4 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={`${p.reference}-${p.problem}-${i}`}
                className="border-b border-border-subtle"
              >
                <td className="py-2 pr-4 whitespace-nowrap">
                  <span
                    className="inline-block size-2.5 rounded-[2px] mr-2 align-middle"
                    style={{ background: byArea.get(p.area)?.color }}
                    aria-hidden
                  />
                  {byArea.get(p.area)?.label ?? p.area}
                </td>
                <td className="py-2 pr-4" dangerouslySetInnerHTML={{ __html: p.problemHtml }} />
                <td className="py-2 pr-4 tabular-nums whitespace-nowrap">{p.qubitsText}</td>
                <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                  {p.gates.toExponential(1)}
                  {p.converted && "*"}
                  {p.gateType !== "T" && <span className="ml-1">{p.gateType}</span>}
                </td>
                <td className="py-2 pr-4 tabular-nums">{p.year}</td>
                <td className="py-2 pr-4">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {p.reference}
                    </a>
                  ) : (
                    p.reference
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((p) => p.converted) && (
        <p className="mt-10 text-sm text-text-secondary">
          * Operations counts marked with an asterisk have been converted from reported Toffoli to T
          gates ({T_GATES_PER_TOFFOLI} T gates per Toffoli gate) for chart standardization.
        </p>
      )}
    </div>
  );
}
