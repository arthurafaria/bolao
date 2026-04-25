"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const COMPETITIONS = {
	WC2026: {
		code: "WC2026",
		label: "Copa do Mundo",
		sublabel: "2026",
		flag: "🌍",
	},
	BSA2026: {
		code: "BSA2026",
		label: "Brasileirão",
		sublabel: "Série A 2026",
		flag: "🇧🇷",
	},
	DEMO: {
		code: "DEMO",
		label: "Demonstração",
		sublabel: "Dados de exemplo",
		flag: "🎮",
	},
} as const;

export type TournamentCode = keyof typeof COMPETITIONS;

const STORAGE_KEY = "bolao_tournament";

const TournamentContext = createContext<{
	tournament: TournamentCode;
	setTournament: (t: TournamentCode) => void;
}>({ tournament: "BSA2026", setTournament: () => {} });

export function TournamentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [tournament, setTournamentState] = useState<TournamentCode>("BSA2026");

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY) as TournamentCode | null;
		if (saved && saved in COMPETITIONS) {
			setTournamentState(saved);
		}
	}, []);

	const setTournament = (t: TournamentCode) => {
		setTournamentState(t);
		localStorage.setItem(STORAGE_KEY, t);
	};

	return (
		<TournamentContext.Provider value={{ tournament, setTournament }}>
			{children}
		</TournamentContext.Provider>
	);
}

export function useTournament() {
	return useContext(TournamentContext);
}
