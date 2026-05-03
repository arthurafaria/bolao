import { cn } from "@bolao/ui/lib/utils";

interface SparklineProps {
	data: number[];
	width?: number;
	height?: number;
	stroke?: string;
	fill?: string;
	strokeWidth?: number;
	showDots?: boolean;
	className?: string;
}

export function Sparkline({
	data,
	width = 96,
	height = 28,
	stroke = "var(--b-brand)",
	fill = "color-mix(in oklch, var(--b-brand) 14%, transparent)",
	strokeWidth = 2,
	showDots = false,
	className,
}: SparklineProps) {
	if (data.length === 0) {
		return (
			<svg
				className={className}
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				role="img"
				aria-label="Sem dados"
			>
				<title>Sem dados</title>
			</svg>
		);
	}

	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;
	const stepX = data.length > 1 ? width / (data.length - 1) : width;
	const padY = strokeWidth + 2;
	const usableH = height - padY * 2;

	const points = data.map((v, i) => {
		const x = i * stepX;
		const y = padY + (1 - (v - min) / range) * usableH;
		return [x, y] as const;
	});

	const pathD = points
		.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
		.join(" ");

	const fillD = `${pathD} L${(points.at(-1)?.[0] ?? 0).toFixed(2)},${height} L0,${height} Z`;

	const lastPoint = points.at(-1);

	return (
		<svg
			className={cn("block", className)}
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Tendência"
		>
			<title>Tendência ao longo do tempo</title>
			<path d={fillD} fill={fill} stroke="none" />
			<path
				d={pathD}
				fill="none"
				stroke={stroke}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{showDots &&
				points.map(([x, y], i) => (
					<circle
						key={`${x}-${y}-${i}`}
						cx={x}
						cy={y}
						r={strokeWidth}
						fill={stroke}
					/>
				))}
			{lastPoint && (
				<circle
					cx={lastPoint[0]}
					cy={lastPoint[1]}
					r={strokeWidth + 1}
					fill={stroke}
				/>
			)}
		</svg>
	);
}
