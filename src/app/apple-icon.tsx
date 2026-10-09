import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: 38,
				background: "linear-gradient(145deg, #9b8fff 0%, #6748ed 100%)",
			}}
		>
			<svg width="126" height="126" viewBox="0 0 64 64" fill="none">
				<path
					d="M16 15h17.4l6.6 6.6V47a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V15Z"
					fill="white"
					opacity=".35"
				/>
				<path
					d="M22 13h17l9 9v28a3.5 3.5 0 0 1-3.5 3.5h-19A3.5 3.5 0 0 1 22 50V13Z"
					fill="white"
				/>
				<path
					d="M39 13v9h9"
					stroke="#7156F0"
					strokeWidth="3"
					strokeLinejoin="round"
				/>
				<path
					d="M30 30h11M30 37h11M30 44h7"
					stroke="#7156F0"
					strokeWidth="3.25"
					strokeLinecap="round"
				/>
			</svg>
		</div>,
		{ ...size },
	);
}
