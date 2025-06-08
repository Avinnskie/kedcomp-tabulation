'use client';
import { ChartPie, GitFork, LogIn, LogOut, NotebookPen, Scale, Settings, User } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from 'src/components/ui/sidebar';
import { IconBrandTabler } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { SidebarButton } from '../atoms/sidebarButton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SidebarComponentProps {
  children: React.ReactNode;
}

export const SidebarComponent = ({ children }: SidebarComponentProps) => {
  const [open, setOpen] = useState(true);
  const { data: session } = useSession();
  const user = session?.user;
  const [adminOpen, setAdminOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';
  const isJudge = session?.user?.role === 'JUDGE';

  useEffect(() => {
    console.log('Logged in user role:', session?.user?.role);
  }, [session]);

  const handleLogout = async () => {
    const res = await signOut({ redirect: false });
    toast.success('Logout berhasil!');
  };

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
      label: 'Break Open',
      href: '/break-open',
      icon: <ChartPie className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Tabulation',
      href: '/tabulation',
      icon: <Scale className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    // {
    //   label: 'Judge Round',
    //   href: '/round',
    //   icon: <NotebookPen className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    // },
  ];

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-500 md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
        'min-h-screen'
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}

              {isJudge && (
                <SidebarLink
                  link={{
                    label: 'Judge Round',
                    href: '/round',
                    icon: (
                      <NotebookPen className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                    ),
                  }}
                />
              )}

              {isAdmin && (
                <div className="group/sidebar">
                  <button
                    onClick={() => setAdminOpen(!adminOpen)}
                    className="flex items-center justify-start gap-2 w-full py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition"
                  >
                    <Settings className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                    {open && (
                      <>
                        <span className="text-neutral-700 dark:text-neutral-200 text-sm font-semibold">
                          Admin
                        </span>
                        <svg
                          className={cn(
                            'h-4 w-4 ml-auto transition-transform',
                            adminOpen ? 'rotate-90' : ''
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </>
                    )}
                  </button>

                  {open && adminOpen && (
                    <div className="ml-2 mt-1 flex flex-col gap-1">
                      <SidebarLink
                        link={{
                          label: 'Manage Users',
                          href: '/admin',
                          icon: <User className="h-4 w-4 text-neutral-500" />,
                        }}
                      />
                      <SidebarLink
                        link={{
                          label: 'Round Details',
                          href: '/admin/round',
                          icon: <NotebookPen className="h-4 w-4 text-neutral-500" />,
                        }}
                      />
                      <SidebarLink
                        link={{
                          label: 'Manage Judges',
                          href: '/admin/break-open',
                          icon: <Scale className="h-4 w-4 text-neutral-500" />,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <SidebarButton
                  label="Logout"
                  icon={
                    <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                  }
                  onClick={handleLogout}
                />
              ) : (
                <SidebarLink
                  link={{
                    label: 'Login',
                    href: '/login',
                    icon: (
                      <LogIn className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                    ),
                  }}
                />
              )}
            </div>
          </div>
          <div className="px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded px-2 py-2 transition-all">
                  <img
                    src={user?.image ?? '/logo-kdc.png'}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    alt="Avatar"
                  />
                  <span
                    className={cn(
                      'transition-all duration-300 text-left text-sm leading-tight whitespace-normal break-all max-w-[10rem]',
                      open ? 'opacity-100 ml- w-40' : 'opacity-0 w-0 overflow-hidden'
                    )}
                  >
                    {user?.name ?? 'Guest'}
                  </span>
                </button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Wrapper konten kanan dengan margin dinamis */}
      <div
        className={cn(
          'w-full px-2 transition-all duration-300',
          open ? 'md:ml-[200px]' : 'md:ml-[64px]'
        )}
      >
        {children}
      </div>
    </div>
  );
};

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
