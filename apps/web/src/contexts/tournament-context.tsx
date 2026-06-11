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
} as const;

export type TournamentCode = keyof typeof COMPETITIONS;

const STORAGE_KEY = "bolao_tournament";

// Até o fim da final da Copa (19/07/2026), toda sessão abre no modo Copa.
const WC_DEFAULT_UNTIL_MS = Date.UTC(2026, 6, 19, 23, 59, 59);

function defaultTournament(): TournamentCode {
	return Date.now() <= WC_DEFAULT_UNTIL_MS ? "WC2026" : "BSA2026";
}

const TournamentContext = createContext<{
	tournament: TournamentCode;
	setTournament: (t: TournamentCode) => void;
}>({ tournament: "WC2026", setTournament: () => {} });

export function TournamentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [tournament, setTournamentState] =
		useState<TournamentCode>(defaultTournament);

	useEffect(() => {
		if (Date.now() <= WC_DEFAULT_UNTIL_MS) return;

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
