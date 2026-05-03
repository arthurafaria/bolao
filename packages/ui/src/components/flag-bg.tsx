import { cn } from "@bolao/ui/lib/utils";

interface FlagBgProps extends React.ComponentProps<"div"> {
	imageUrl?: string;
	/** Posição do background — útil pra "vir do lado" */
	position?: "left" | "right" | "center";
	/** Intensidade do overlay (0–1) */
	overlayStrength?: number;
	/** Aplicar blur na imagem */
	blur?: boolean;
}

export function FlagBg({
	imageUrl,
	position = "center",
	overlayStrength = 0.85,
	blur = true,
	className,
	children,
	style,
	...props
}: FlagBgProps) {
	const objPos =
		position === "left"
			? "left center"
			: position === "right"
				? "right center"
				: "center";

	return (
		<div
			className={cn(
				"relative isolate overflow-hidden rounded-[28px]",
				className,
			)}
			style={style}
			{...props}
		>
			{imageUrl && (
				<div
					aria-hidden
					className="absolute inset-0 -z-20 bg-center bg-cover"
					style={{
						backgroundImage: `url(${imageUrl})`,
						backgroundPosition: objPos,
						filter: blur ? "blur(18px) saturate(1.2)" : undefined,
						transform: "scale(1.15)",
					}}
				/>
			)}
			<div
				aria-hidden
				className="absolute inset-0 -z-10"
				style={{
					background: "var(--g-flag-overlay)",
					opacity: overlayStrength,
				}}
			/>
			{children}
		</div>
	);
}
