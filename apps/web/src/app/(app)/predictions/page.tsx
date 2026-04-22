"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Badge } from "@bolao/ui/components/badge";
import { Card, CardContent } from "@bolao/ui/components/card";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bolao/ui/components/tabs";
import { useQuery } from "convex/react";

import { MatchCard } from "@/components/match-card";

const STAGES = [
  { key: "GROUP_STAGE", label: "Grupos" },
  { key: "ROUND_OF_16", label: "Oitavas" },
  { key: "QUARTER_FINALS", label: "Quartas" },
  { key: "SEMI_FINALS", label: "Semis" },
  { key: "FINAL", label: "Final" },
];

function StageMatches({ stage }: { stage: string }) {
  const matches = useQuery(api.matches.getByStage, { tournament: "WC2026", stage });

  if (matches === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Jogos desta fase ainda não disponíveis
        </CardContent>
      </Card>
    );
  }

  const groups: Record<string, typeof matches> = {};
  for (const m of matches) {
    if (!m) continue;
    const key = m.group ?? m.stage;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupKey, groupMatches]) => (
        <div key={groupKey}>
          {groupKey !== stage && (
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline">Grupo {groupKey}</Badge>
            </div>
          )}
          <div className="space-y-3">
            {groupMatches.map((m) => m && <MatchCard key={m._id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Palpites</h1>
        <p className="text-sm text-muted-foreground">
          Palpites se fecham 1 hora antes de cada jogo
        </p>
      </div>

      <Tabs defaultValue="GROUP_STAGE">
        <TabsList className="w-full overflow-x-auto justify-start h-auto flex-wrap gap-1 p-1">
          {STAGES.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {STAGES.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <StageMatches stage={key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
