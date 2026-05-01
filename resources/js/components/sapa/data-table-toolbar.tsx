import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type FilterOption = {
    value: string;
    label: string;
};

export type FilterControl = {
    name: string;
    placeholder: string;
    value: string;
    options: FilterOption[];
};

type Props = {
    path: string;
    searchValue?: string;
    searchPlaceholder?: string;
    showSearch?: boolean;
    filters?: FilterControl[];
    only?: string[];
    extraQuery?: Record<string, string>;
};

export function DataTableToolbar({
    path,
    searchValue = '',
    searchPlaceholder = 'Cari…',
    showSearch = true,
    filters = [],
    only,
    extraQuery = {},
}: Props) {
    const [search, setSearch] = useState(searchValue);
    const initialRender = useRef(true);

    const applyQuery = useCallback(
        (overrides: Record<string, string>, currentSearch: string = search) => {
            const merged: Record<string, string> = {
                ...currentQuery(),
                ...extraQuery,
                search: currentSearch,
                ...overrides,
            };

            const cleaned: Record<string, string> = {};
            Object.entries(merged).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    cleaned[key] = String(value);
                }
            });

            router.get(path, cleaned, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only,
            });
        },
        [path, only, extraQuery, search],
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearch(searchValue);
    }, [searchValue]);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const handle = window.setTimeout(() => {
            applyQuery({ page: '1' }, search);
        }, 300);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleFilterChange = (name: string, value: string) => {
        applyQuery({ [name]: value === '__all__' ? '' : value, page: '1' });
    };

    const hasActiveFilter =
        search.length > 0 ||
        filters.some((filter) => filter.value && filter.value.length > 0);

    return (
        <div className="flex flex-col gap-3 border-b border-sidebar-border/70 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-sidebar-border">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                {showSearch && (
                    <div className="relative w-full max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-9"
                        />
                    </div>
                )}

                {filters.map((filter) => (
                    <Select
                        key={filter.name}
                        value={filter.value || '__all__'}
                        onValueChange={(value) =>
                            handleFilterChange(filter.name, value)
                        }
                    >
                        <SelectTrigger className="h-9 w-full sm:w-[200px]">
                            <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">
                                {filter.placeholder}
                            </SelectItem>
                            {filter.options.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}
            </div>

            {hasActiveFilter && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSearch('');
                        const cleared: Record<string, string> = {
                            search: '',
                            page: '1',
                        };
                        filters.forEach((filter) => {
                            cleared[filter.name] = '';
                        });
                        applyQuery(cleared);
                    }}
                >
                    <X className="size-4" />
                    Bersihkan
                </Button>
            )}
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
        result[key] = value;
    });

    return result;
}
