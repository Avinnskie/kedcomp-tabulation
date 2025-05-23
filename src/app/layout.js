import { Montserrat } from 'next/font/google';
import './globals.css';
import { GitFork, Scale, User, Users } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from 'src/components/ui/sidebar';
import { IconBrandTabler } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Pastikan sesuai dengan yang tersedia
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Khatuliswa English Debating Competition',
  description:
    'Khatuliswa English Debating Competition is a provincial English debate competition open to senior high school students in West Kalimantan.',
};

export default function RootLayout({ children }) {
  const links = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Participant',
      href: '/participant',
      icon: <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Bracket',
      href: '/bracket',
      icon: <GitFork className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Tabulation',
      href: '/tabulation',
      icon: <Scale className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ];
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <div
          className={cn(
            'flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-500 bg- md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
            // for your use case, use `h-screen` instead of `h-[60vh]`
            'min-h-screen'
          )}
        >
          <Sidebar animate={false}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <Logo />
                <div className="mt-8 flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <div>
                <SidebarLink
                  link={{
                    label: 'Manu Arora',
                    href: '#',
                    icon: (
                      <img
                        src="https://assets.aceternity.com/manu.png"
                        className="h-7 w-7 shrink-0 rounded-full"
                        width={50}
                        height={50}
                        alt="Avatar"
                      />
                    ),
                  }}
                />
              </div>
            </SidebarBody>
          </Sidebar>
          {children}
        </div>
      </body>
    </html>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image src={'/logo-kdc.png'} width={30} height={30} alt={'logo'} />
      <h5 className="font-bold">KEDCOMP 2025</h5>
    </a>
  );
};
