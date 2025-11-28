import './globals.css'; // Assuming your global styles are here
import SessionWrapper from '@/components/providers/SessionProvider';
import Navbar from '@/components/shared/Navbar';
import { Inter } from 'next/font/google'; // Example font import

const inter = Inter({ subsets: ['latin'] });

// We define Metadata here (Server Component requirement)
export const metadata = {
  title: 'RareEarthMinerals.ai - Evidence Vault',
  description: 'The world-class immutable evidence platform for battery supply chains.',
};

// The root layout must be a Server Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* CRITICAL: SessionProvider wraps the entire application. */}
        <SessionWrapper>
            {/* The Navbar is rendered inside the wrapper */}
            <Navbar />
            
            {/* Main content */}
            <div className="pt-[50px]"> {/* Add padding for the fixed/sticky navbar */}
                {children}
            </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
