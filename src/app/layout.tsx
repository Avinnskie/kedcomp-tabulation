import { Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Khatuliswa English Debating Competition',
  description:
    'Khatuliswa English Debating Competition is a provincial English debate competition open to senior high school students in West Kalimantan.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
