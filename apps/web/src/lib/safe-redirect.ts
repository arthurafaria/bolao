import type { Route } from "next";

/**
 * Aceita apenas paths internos (começando com "/" e não "//")
 * para evitar open redirect via query param.
 */
export function sanitizeRedirect(value: string | null): string | null {
	if (!value) return null;
	if (!value.startsWith("/") || value.startsWith("//")) return null;
	return value;
}

/**
 * Destino pós-autenticação: query param `redirect` validado,
 * senão convite pendente guardado em sessionStorage, senão dashboard.
 */
export function getPostAuthRedirect(): Route {
	if (typeof window === "undefined") return "/dashboard";
	const param = sanitizeRedirect(
		new URLSearchParams(window.location.search).get("redirect"),
	);
	if (param) return param as Route;
	const pendingInvite = sessionStorage.getItem("pendingInvite");
	if (pendingInvite) return `/convite/${pendingInvite}` as Route;
	return "/dashboard";
}
