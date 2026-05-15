"use client";
import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface LeaderEntry {
  id: string; name: string; avatar?: string;
  level: number; periodXp: number; xp?: number;
}

type Period = "weekly" | "monthly" | "all";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];
function xpProgress(xp: number, level: number) {
  const cur = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? cur;
  if (next === cur) return 100;
  return Math.round(((xp - cur) / (next - cur)) * 100);
}

const LEVEL_NAMES = ["", "Başlangıç", "Acemi", "Üye", "Kıdemli", "Usta", "Uzman", "Efsane"];

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>("weekly");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    api.get("/leaderboard", { params: { period } }).then(({ data }) => setEntries(data.leaderboard));
  }, [period]);

  const myRank = entries.findIndex((e) => e.id === user?.id) + 1;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />Liderboard
        </h1>
        <p className="text-muted-foreground mt-1">Kim en çok XP kazandı?</p>
      </div>

      <div className="flex gap-2">
        {(["weekly", "monthly", "all"] as Period[]).map((p) => (
          <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
            {p === "weekly" ? "Bu Hafta" : p === "monthly" ? "Bu Ay" : "Tüm Zamanlar"}
          </Button>
        ))}
      </div>

      {myRank > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-primary">Sıralaman: #{myRank}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {period === "weekly" ? "Haftalık" : period === "monthly" ? "Aylık" : "Genel"} Sıralama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz XP kazanılmamış. İlk görevi tamamla!
            </p>
          )}
          {entries.map((entry, idx) => {
            const xp = entry.periodXp ?? entry.xp ?? 0;
            const isMe = entry.id === user?.id;
            return (
              <div key={entry.id} className={`flex items-center gap-4 p-3 rounded-lg ${isMe ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
                <div className="flex items-center justify-center w-6">{rankIcon(idx + 1)}</div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={`text-xs font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {entry.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{entry.name}{isMe && " (Sen)"}</p>
                    <Badge variant="outline" className="text-xs">{LEVEL_NAMES[entry.level] ?? `Lv${entry.level}`}</Badge>
                  </div>
                  <Progress value={xpProgress(entry.xp ?? xp, entry.level)} className="h-1 mt-1" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
