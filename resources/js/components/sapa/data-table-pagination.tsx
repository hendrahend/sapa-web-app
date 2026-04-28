import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    path: string;
};

type Props = {
    meta: PaginationMeta;
    only?: string[];
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
};

export function DataTablePagination({
    meta,
    only,
    onPerPageChange,
    perPageOptions = [10, 15, 25, 50, 100],
}: Props) {
    const isFirst = meta.current_page <= 1;
    const isLast = meta.current_page >= meta.last_page;

    const goto = (page: number) => {
        router.get(
            meta.path,
            { ...currentQuery(), page },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only,
            },
        );
    };

    const handlePerPageChange = (value: string) => {
        const next = Number(value);

        if (onPerPageChange) {
            onPerPageChange(next);

            return;
        }

        router.get(
            meta.path,
            { ...currentQuery(), per_page: next, page: 1 },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only,
            },
        );
    };

    return (
        <div className="flex flex-col gap-3 border-t border-sidebar-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                    {meta.total === 0
                        ? 'Tidak ada data'
                        : `${meta.from ?? 0}–${meta.to ?? 0} dari ${meta.total}`}
                </span>
                <div className="hidden items-center gap-2 sm:flex">
                    <span>Per halaman</span>
                    <Select
                        value={String(meta.per_page)}
                        onValueChange={handlePerPageChange}
                    >
                        <SelectTrigger className="h-8 w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {perPageOptions.map((option) => (
                                <SelectItem key={option} value={String(option)}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">
                    Halaman {meta.current_page} dari {meta.last_page || 1}
                </span>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={isFirst}
                    onClick={() => goto(meta.current_page - 1)}
                    aria-label="Halaman sebelumnya"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={isLast}
                    onClick={() => goto(meta.current_page + 1)}
                    aria-label="Halaman berikutnya"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}

function currentQuery(): Record<string, string> {
    if (typeof window === 'undefined') {
        return {};
    }

    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
        if (key === 'page') {
            return;
        }

        result[key] = value;
    });

    return result;
}
