"use client";

import { createContext, useContext } from "react";

export const COMPETITIONS = {
	BSA2026: {
		code: "BSA2026",
		label: "Brasileirão",
		sublabel: "Série A 2026",
		flag: "🇧🇷",
	},
} as const;

export type TournamentCode = keyof typeof COMPETITIONS;

const TournamentContext = createContext<{
	tournament: TournamentCode;
	setTournament: (t: TournamentCode) => void;
}>({ tournament: "BSA2026", setTournament: () => {} });

export function TournamentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<TournamentContext.Provider
			value={{ tournament: "BSA2026", setTournament: () => {} }}
		>
			{children}
		</TournamentContext.Provider>
	);
}

export function useTournament() {
	return useContext(TournamentContext);
}
