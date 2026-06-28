"use client";

import { Button } from "@bolao/ui/components/button";
import { PillTabs } from "@bolao/ui/components/pill-tabs";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@bolao/ui/components/sheet";
import { toPng } from "html-to-image";
import {
	Download,
	Image as ImageIcon,
	Loader2,
	Share2,
	Square,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
	type ShareEntry,
	type ShareFormat,
	ShareRankingCard,
} from "@/components/leagues/share-ranking-card";

const PREVIEW_W = 300;
const SCALE = PREVIEW_W / 360;
const CARD_H: Record<ShareFormat, number> = { story: 640, feed: 360 };

function slugify(s: string) {
	return (
		s
			.toLowerCase()
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "liga"
	);
}

interface ShareRankingSheetProps {
	leagueName: string;
	phaseLabel: string;
	accent: string;
	entries: ShareEntry[];
}

export function ShareRankingSheet({
	leagueName,
	phaseLabel,
	accent,
	entries,
}: ShareRankingSheetProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [format, setFormat] = useState<ShareFormat>("story");
	const [busy, setBusy] = useState<null | "share" | "download">(null);

	async function renderPng(): Promise<string | null> {
		const node = cardRef.current;
		if (!node) return null;
		// Garante que as fontes carregaram antes de capturar.
		if (typeof document !== "undefined" && "fonts" in document) {
			try {
				await (document as Document).fonts.ready;
			} catch {
				// ignora
			}
		}
		return toPng(node, {
			pixelRatio: 3,
			cacheBust: true,
			backgroundColor: getComputedStyle(node).backgroundColor || undefined,
		});
	}

	function fileName() {
		return `bolao-${slugify(leagueName)}-${slugify(phaseLabel)}-${format}.png`;
	}

	async function handleDownload() {
		setBusy("download");
		try {
			const dataUrl = await renderPng();
			if (!dataUrl) return;
			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = fileName();
			a.click();
			toast.success("Imagem baixada! Já pode postar nos stories.");
		} catch (err) {
			console.error(err);
			toast.error("Não consegui gerar a imagem. Tenta de novo.");
		} finally {
			setBusy(null);
		}
	}

	async function handleShare() {
		setBusy("share");
		try {
			const dataUrl = await renderPng();
			if (!dataUrl) return;
			const blob = await (await fetch(dataUrl)).blob();
			const file = new File([blob], fileName(), { type: "image/png" });
			const nav = navigator as Navigator & {
				canShare?: (data?: ShareData) => boolean;
			};
			if (nav.canShare?.({ files: [file] }) && nav.share) {
				await nav.share({
					files: [file],
					title: `${leagueName} · ${phaseLabel}`,
					text: `Ranking da liga ${leagueName} (${phaseLabel}) — Bolão da Copa 2026 ⚽`,
				});
			} else {
				const a = document.createElement("a");
				a.href = dataUrl;
				a.download = fileName();
				a.click();
				toast.success("Imagem baixada! (compartilhamento direto indisponível)");
			}
		} catch (err) {
			if ((err as Error)?.name === "AbortError") return; // usuário cancelou
			console.error(err);
			toast.error("Não consegui compartilhar. Tenta baixar a imagem.");
		} finally {
			setBusy(null);
		}
	}

	const disabled = busy !== null;

	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" size="default" />}>
				<ImageIcon className="h-4 w-4" />
				Gerar print
			</SheetTrigger>
			<SheetContent side="right" className="bg-[var(--b-card)]">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle className="font-black font-display text-2xl text-[var(--b-text)] uppercase tracking-tight">
						Print do ranking
					</SheetTitle>
					<SheetDescription className="text-[var(--b-text-3)] text-sm">
						Gera uma imagem pronta pra postar nos stories ou no feed —{" "}
						<strong className="text-[var(--b-text-2)]">{phaseLabel}</strong>.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
					<PillTabs
						aria-label="Formato da imagem"
						size="sm"
						fullWidth
						value={format}
						onChange={setFormat}
						items={[
							{ value: "story", label: "Story 9:16", icon: ImageIcon },
							{ value: "feed", label: "Feed 1:1", icon: Square },
						]}
					/>

					{/* Preview (escalado) */}
					<div className="flex justify-center">
						<div
							className="overflow-hidden rounded-[18px] shadow-[var(--b-shadow-card-soft)] ring-1 ring-[var(--b-border-sm)]"
							style={{
								width: PREVIEW_W,
								height: CARD_H[format] * SCALE,
							}}
						>
							<div
								style={{
									transform: `scale(${SCALE})`,
									transformOrigin: "top left",
								}}
							>
								<ShareRankingCard
									ref={cardRef}
									format={format}
									leagueName={leagueName}
									phaseLabel={phaseLabel}
									accent={accent}
									entries={entries}
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<Button
							onClick={handleShare}
							variant="action"
							size="lg"
							disabled={disabled}
						>
							{busy === "share" ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Share2 className="h-4 w-4" />
							)}
							Compartilhar
						</Button>
						<Button
							onClick={handleDownload}
							variant="outline"
							size="lg"
							disabled={disabled}
						>
							{busy === "download" ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Download className="h-4 w-4" />
							)}
							Baixar imagem
						</Button>
					</div>

					<p className="text-center text-[var(--b-text-3)] text-xs leading-relaxed">
						No celular, "Compartilhar" abre direto o Instagram, WhatsApp e mais.
						No computador, a imagem é baixada.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}
