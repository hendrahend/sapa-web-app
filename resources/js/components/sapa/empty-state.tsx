import { Inbox } from 'lucide-react';
import type { ComponentType, ReactNode, SVGProps } from 'react';

type Props = {
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    className = '',
}: Props) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-border/70 bg-card/50 px-6 py-12 text-center dark:border-sidebar-border ${className}`}
        >
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
                {title}
            </p>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
