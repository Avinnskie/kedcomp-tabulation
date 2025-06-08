import { Toaster } from 'sonner';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-center" />
      <section className="flex items-center justify-center h-screen bg-gray-100">
        {children}
      </section>
    </>
  );
}
