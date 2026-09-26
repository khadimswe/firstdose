// The who-sees-what split, worded as in docs/who-sees-what.md.
const ROWS = [
  {
    row: "Holds",
    practice:
      "The chart, patient names, insurance detail, fill status, the coordinator's queue, the before-visit card, the doctor's alerts",
    ascend:
      "The Ascend channel the doctor already uses (the alert carries no chart), copay and sample program options, the Wallet link, the FDA's label text, aggregate recovery stats",
  },
  {
    row: "Sends out",
    practice:
      "Drug, insurance type (commercial / government), state, and \"started / recovered\" counts with no names",
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
  "Nobody is paid per prescription. Market Access pays per patient recovered, measured in aggregate.",
];

export function WhoSeesWhat() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Who sees what</h2>
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
