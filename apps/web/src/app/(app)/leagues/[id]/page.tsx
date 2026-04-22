"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import type { Id } from "@bolao/backend/convex/_generated/dataModel";
import { Badge } from "@bolao/ui/components/badge";
import { Button } from "@bolao/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@bolao/ui/components/card";
import { Separator } from "@bolao/ui/components/separator";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { Check, Copy, Crown, Settings, Users } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";

function RankingRow({
  position,
  member,
  isMe,
}: {
  position: number;
  member: { userId: string; totalPoints: number; exactScores: number; correctResults: number };
  isMe: boolean;
}) {
  const user = useQuery(api.auth.getCurrentUser);
  const isCurrentUser = isMe && user?._id === member.userId;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
        isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"
      }`}
    >
      <span
        className={`w-7 text-center font-bold text-sm ${
          position === 1
            ? "text-accent"
            : position <= 3
              ? "text-muted-foreground"
              : "text-muted-foreground/60"
        }`}
      >
        {position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : position}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate text-sm">
            {isCurrentUser ? "Você" : `Jogador ${member.userId.slice(-4)}`}
          </span>
          {position === 1 && <Crown className="h-3.5 w-3.5 text-accent shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {member.exactScores} exatos · {member.correctResults} acertos
        </p>
      </div>
      <span className="font-bold text-sm tabular-nums">{member.totalPoints} pts</span>
    </div>
  );
}

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const leagueId = id as Id<"leagues">;

  const league = useQuery(api.leagues.getById, { leagueId });
  const ranking = useQuery(api.leagues.getRanking, { leagueId });
  const currentUser = useQuery(api.auth.getCurrentUser);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!league?.inviteCode) return;
    navigator.clipboard.writeText(league.inviteCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (league === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (league === null) {
    return <div className="text-center text-muted-foreground py-12">Liga não encontrada</div>;
  }

  const isOwner = currentUser?._id === league.ownerId;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          {league.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{league.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{league.memberCount} membros</span>
            <Badge variant="outline" className="text-xs">
              {league.joinType === "OPEN" ? "Aberta" : "Moderada"}
            </Badge>
          </div>
        </div>
        {isOwner && (
          <Link href={`/leagues/${id}/manage`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-1.5 h-4 w-4" />
              Gerenciar
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Código de convite</p>
            <p className="font-mono font-bold text-xl tracking-widest text-primary">
              {league.inviteCode}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyCode}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1.5">{copied ? "Copiado!" : "Copiar"}</span>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Ranking</h2>
        <Card>
          <CardContent className="p-2">
            {ranking === undefined ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : ranking.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhum membro ativo ainda
              </div>
            ) : (
              <div className="space-y-1">
                {ranking.map((member, idx) => (
                  <RankingRow
                    key={member._id}
                    position={idx + 1}
                    member={member}
                    isMe={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
