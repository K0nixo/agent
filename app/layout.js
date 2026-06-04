import "./globals.css";

export const metadata = {
  title: "Speedrunner HQ",
  description: "Interní command center pro FXSpeedrunner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
