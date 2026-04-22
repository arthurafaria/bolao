"use client";

import { api } from "@bolao/backend/convex/_generated/api";
import { Badge } from "@bolao/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@bolao/ui/components/card";
import { Progress } from "@bolao/ui/components/progress";
import { Separator } from "@bolao/ui/components/separator";
import { Skeleton } from "@bolao/ui/components/skeleton";
import { useQuery } from "convex/react";
import { Shield, Star, Trophy, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@bolao/ui/components/button";

export default function ProfilePage() {
  const user = useQuery(api.auth.getCurrentUser);
  const stats = useQuery(api.predictions.getStats);
  const leagues = useQuery(api.leagues.getUserLeagues);
  const router = useRouter();

  function handleSignOut() {
    authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  }

  const accuracy = stats && stats.total > 0
    ? Math.round((stats.correct / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.name ?? "..."}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total de pontos", value: stats?.totalPoints ?? 0, icon: <Trophy className="h-4 w-4" /> },
          { label: "Palpites feitos", value: stats?.total ?? 0, icon: <Shield className="h-4 w-4" /> },
          { label: "Placares exatos", value: stats?.exact ?? 0, icon: <Star className="h-4 w-4" /> },
          { label: "Ligas", value: leagues?.length ?? 0, icon: <Trophy className="h-4 w-4" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.total > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxa de acerto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stats.correct} acertos de {stats.total} palpites</span>
              <span className="font-bold">{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-2" />
          </CardContent>
        </Card>
      )}

      {leagues && leagues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Minhas ligas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leagues.map(
              (league) =>
                league && (
                  <div key={league._id} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{league.name}</span>
                    <Badge variant="secondary">{league.myPoints} pts</Badge>
                  </div>
                ),
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button variant="destructive" onClick={handleSignOut} className="w-full">
        Sair da conta
      </Button>
    </div>
  );
}
