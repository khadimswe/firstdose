import { SideBadge } from "@/components/SideBadge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Beat } from "@/components/data/types";
import { cn } from "@/lib/utils";

export function BeatRow({
  beat,
  n,
  who,
  firedIds,
  isNext,
  onFire,
}: {
  beat: Beat;
  n: number;
  who: string;
  firedIds: ReadonlySet<string>;
  isNext: boolean;
  onFire: () => void;
}) {
  const done = beat.events.every((e) => firedIds.has(e.id));

  return (
    <Card size="sm" className={cn(isNext && "ring-2 ring-foreground", done && "opacity-60")}>
      <CardHeader>
        <CardTitle className="font-mono text-sm">
          {n}. {beat.case_id} · {who}
        </CardTitle>
        <CardAction>
          <Button onClick={onFire} disabled={done} variant={isNext ? "default" : "outline"}>
            {done ? "Fired" : "Fire"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <table className="w-full text-left text-xs">
          <tbody>
            {beat.events.map((e) => (
              <tr key={e.id} className="border-t align-top">
                <td className="w-5 py-1">{firedIds.has(e.id) ? "✓" : "○"}</td>
                <td className="w-14 py-1 font-mono">{e.id}</td>
                <td className="w-24 py-1">{e.actor}</td>
                <td className="w-36 py-1 font-mono">{e.type}</td>
                <td className="py-1">
                  {e.status_text && <div className="font-medium">{e.status_text}</div>}
                  {e.reject_code && <div>Reject {e.reject_code}</div>}
                  <div className="text-muted-foreground">{e.note}</div>
                </td>
                <td className="w-40 py-1 text-right">
                  <SideBadge side={e.side} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
