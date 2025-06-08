import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';
import { useSidebar } from '../ui/sidebar';

interface SidebarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
}

export const SidebarButton = ({ label, icon, className, ...props }: SidebarButtonProps) => {
  const { open, animate } = useSidebar();

  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-start gap-2 group/sidebar py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition w-full',
        className
      )}
      {...props}
    >
      {icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-semibold"
      >
        {label}
      </motion.span>
    </button>
  );
};
