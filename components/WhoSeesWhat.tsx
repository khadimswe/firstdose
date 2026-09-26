// Proposed sharing boundary; current practice event counts are labelled separately.
const ROWS = [
  {
    row: "Holds",
    practice:
      "The chart, patient names, insurance detail, fill status, the coordinator's queue, the before-visit card, the doctor's alerts",
    ascend:
      "Proposed Ascend channel, copay and sample program options, Wallet link, FDA label text and aggregate fill-confirmation counts",
  },
  {
    row: "Sends out",
    practice:
      "Proposed: drug, insurance type (commercial / government), state and pharmacy fill-confirmation counts with no names",
    ascend: "Program options and links, label text",
  },
  {
    row: "Never sends",
    practice: "The chart, names, dates of birth, prescription counts per doctor",
    ascend: "—",
  },
  {
    row: "Never receives",
    practice: "—",
    ascend: "Anything that identifies a patient, or how much any doctor prescribes",
  },
];

const RULES = [
  "The doctor picks the drug. FirstDose never suggests one. It only acts after the order is signed.",
  "The FDA's words are shown exactly as written. No AI-written drug claims.",
  "Proposed payment model: aggregate access outcomes, never prescription volume. A pharmacy fill does not establish clinical recovery.",
];

export function WhoSeesWhat() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Who sees what</h2>
      <p className="text-sm text-muted-foreground">Proposed sharing boundary. This demo uses fictional records; the Ascend projection is not verified.</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-36 p-3" />
              <th className="p-3 text-practice">Practice side (the doctor&apos;s office)</th>
              <th className="p-3 text-ascend">Impiricus Ascend side (drug company)</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.row} className="border-b align-top last:border-0">
                <th className="p-3 font-medium">{r.row}</th>
                <td className="p-3">{r.practice}</td>
                <td className="p-3">{r.ascend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </section>
  );
}
