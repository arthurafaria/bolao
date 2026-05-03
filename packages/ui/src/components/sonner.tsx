"use client";

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: (
					<CircleCheckIcon
						className="size-4"
						style={{ color: "var(--b-success)" }}
					/>
				),
				info: (
					<InfoIcon className="size-4" style={{ color: "var(--b-info)" }} />
				),
				warning: (
					<TriangleAlertIcon
						className="size-4"
						style={{ color: "var(--b-warning)" }}
					/>
				),
				error: (
					<OctagonXIcon
						className="size-4"
						style={{ color: "var(--b-danger)" }}
					/>
				),
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--b-card)",
					"--normal-text": "var(--b-text)",
					"--normal-border": "var(--b-border-md)",
					"--border-radius": "var(--radius-xl)",
					"--success-bg": "var(--b-success-bg)",
					"--success-text": "var(--b-success)",
					"--success-border": "var(--b-success-bg)",
					"--error-bg": "var(--b-danger-bg)",
					"--error-text": "var(--b-danger)",
					"--error-border": "var(--b-danger-bg)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
