import { ImageResponse } from "next/og";

export const alt =
	"ResourceDocs AI documentation generator for FiveM and RedM resources";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
	return new ImageResponse(
		<div
			style={{
				position: "relative",
				display: "flex",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				background: "#09090f",
				color: "#f7f7fb",
				fontFamily: "sans-serif",
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					backgroundImage:
						"linear-gradient(rgba(143,130,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(143,130,255,0.09) 1px, transparent 1px)",
					backgroundSize: "52px 52px",
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: -80,
					top: -110,
					display: "flex",
					width: 560,
					height: 560,
					borderRadius: 560,
					background:
						"radial-gradient(circle, rgba(111,80,242,0.42) 0%, rgba(111,80,242,0) 68%)",
				}}
			/>
			<div
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					width: "100%",
					padding: "62px 72px 58px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center" }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 62,
							height: 62,
							borderRadius: 17,
							background: "#6f50f2",
							boxShadow: "0 18px 50px rgba(111,80,242,0.34)",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								width: 28,
								height: 36,
								borderRadius: 5,
								background: "white",
								padding: "0 6px",
							}}
						>
							<span
								style={{ height: 3, background: "#6f50f2", borderRadius: 2 }}
							/>
							<span
								style={{
									height: 3,
									marginTop: 5,
									background: "#b8adff",
									borderRadius: 2,
								}}
							/>
							<span
								style={{
									height: 3,
									marginTop: 5,
									background: "#b8adff",
									borderRadius: 2,
								}}
							/>
						</div>
					</div>
					<span style={{ marginLeft: 18, fontSize: 30, fontWeight: 800 }}>
						ResourceDocs
					</span>
					<span
						style={{
							marginLeft: 22,
							border: "1px solid rgba(255,255,255,0.18)",
							borderRadius: 999,
							padding: "8px 14px",
							fontSize: 16,
							color: "#b8b8c5",
						}}
					>
						AI documentation generator
					</span>
				</div>

				<div
					style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}
				>
					<div
						style={{
							display: "flex",
							fontSize: 66,
							lineHeight: 1.02,
							fontWeight: 850,
							letterSpacing: "-3px",
						}}
					>
						Turn FiveM &amp; RedM resources into documentation.
					</div>
					<div
						style={{
							display: "flex",
							marginTop: 24,
							fontSize: 24,
							lineHeight: 1.45,
							color: "#a8a8b5",
						}}
					>
						Source-backed installation, configuration, exports, events,
						commands, and dependencies.
					</div>
				</div>

				<div style={{ display: "flex", alignItems: "center" }}>
					{[
						"Static analysis",
						"Copyable code",
						"Escrow aware",
						"Markdown export",
					].map((label) => (
						<span
							key={label}
							style={{
								marginRight: 12,
								borderRadius: 10,
								background: "rgba(255,255,255,0.075)",
								padding: "10px 15px",
								fontSize: 16,
								color: "#d3d3dc",
							}}
						>
							{label}
						</span>
					))}
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
