import './globals.css';

export const metadata = {
  title: 'Avioli Stream — Films et séries en streaming',
  description: 'Regardez vos films et séries préférés, où que vous soyez.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body bg-night text-ink min-h-screen">{children}</body>
    </html>
  );
}
