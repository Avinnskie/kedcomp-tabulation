import { cn } from '@/lib/utils';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-1 gap-4 md:auto-rows-[8.5rem] md:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  content,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'group/bento shadow-input row-span-1 flex flex-col justify-center items-center space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none h-max',
        className
      )}
    >
      {header}
      <div className="w-full transition duration-200 group-hover/bento:translate-x-2 flex flex-col items-center">
        {icon}
        <div className="mt-2 mb-2 font-sans text-2xl font-semibold text-neutral-600 dark:text-neutral-200 text-center">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300 text-center">
          {description}
        </div>
        {content && <div className="w-full">{content}</div>}
      </div>
    </div>
  );
};
