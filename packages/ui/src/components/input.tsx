import { cn } from "@bolao/ui/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-10 w-full min-w-0 rounded-xl border border-[var(--b-border-md)] bg-[var(--b-input-bg)]",
				"px-3.5 py-2 text-sm text-[var(--b-text)] outline-none",
				"placeholder:text-[var(--b-text-4)]",
				"transition-[border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
				"focus-visible:border-[var(--b-brand)] focus-visible:ring-2 focus-visible:ring-[var(--b-brand)/20%]",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:border-[var(--b-danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--b-danger)/20%]",
				"aria-[invalid=true]:animate-shake",
				"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

/* FloatingInput — label flutua quando o campo tem valor ou está focado */
interface FloatingInputProps extends React.ComponentProps<"input"> {
	label: string;
	error?: string;
	icon?: React.ReactNode;
	rightSlot?: React.ReactNode;
}

function FloatingInput({
	label,
	error,
	icon,
	rightSlot,
	className,
	id,
	...props
}: FloatingInputProps) {
	const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
	const [focused, setFocused] = React.useState(false);
	const hasValue = Boolean(props.value || props.defaultValue);
	const floated = focused || hasValue;

	return (
		<div className="relative w-full">
			<div
				className={cn(
					"group relative flex w-full items-center rounded-xl border bg-[var(--b-input-bg)]",
					"transition-[border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
					error
						? "border-[var(--b-danger)] ring-2 ring-[var(--b-danger)/20%]"
						: focused
							? "border-[var(--b-brand)] ring-2 ring-[var(--b-brand)/15%]"
							: "border-[var(--b-border-md)]",
				)}
			>
				{icon && (
					<span
						className="pointer-events-none ml-3.5 shrink-0 text-[var(--b-text-4)] transition-colors duration-[var(--motion-base)]"
						style={{ color: focused ? "var(--b-brand)" : undefined }}
					>
						{icon}
					</span>
				)}

				<div className="relative flex-1">
					<label
						htmlFor={inputId}
						className={cn(
							"pointer-events-none absolute left-3.5 font-medium text-[var(--b-text-4)]",
							"transition-all duration-[var(--motion-base)] ease-[var(--ease-out-quart)]",
							floated
								? "top-1.5 text-[10px] tracking-wide"
								: "top-1/2 -translate-y-1/2 text-sm",
							focused && floated && "text-[var(--b-brand)]",
							icon && "left-2",
						)}
					>
						{label}
					</label>
					<input
						id={inputId}
						data-slot="input"
						onFocus={(e) => {
							setFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setFocused(false);
							props.onBlur?.(e);
						}}
						className={cn(
							"w-full bg-transparent outline-none",
							"text-sm text-[var(--b-text)] placeholder:text-transparent",
							"disabled:pointer-events-none disabled:opacity-50",
							floated ? "pb-2 pt-5" : "py-3",
							icon ? "px-2" : "px-3.5",
							className,
						)}
						{...props}
					/>
				</div>

				{rightSlot && (
					<span className="mr-3 shrink-0 text-[var(--b-text-4)]">{rightSlot}</span>
				)}
			</div>

			{error && (
				<p
					className="mt-1.5 text-xs animate-slide-up"
					style={{ color: "var(--b-danger)" }}
				>
					{error}
				</p>
			)}
		</div>
	);
}

export { Input, FloatingInput };
