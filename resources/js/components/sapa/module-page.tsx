import { Head } from '@inertiajs/react';

type ModulePageProps = {
    title: string;
    eyebrow: string;
    summary: string;
    stats: {
        label: string;
        value: string;
    }[];
};

export function ModulePage({
    title,
    eyebrow,
    summary,
    stats,
}: ModulePageProps) {
    return (
        <>
            <Head title={title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        {eyebrow}
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
                        {title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {summary}
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <p className="text-sm text-muted-foreground">
                                {stat.label}
                            </p>
                            <p className="mt-3 text-2xl font-semibold">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </section>
            </div>
        </>
    );
}
