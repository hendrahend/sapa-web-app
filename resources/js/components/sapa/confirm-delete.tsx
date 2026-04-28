import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    url: string;
    title?: string;
    description?: string;
    confirmLabel?: string;
    trigger?: ReactNode;
    triggerLabel?: string;
    onSuccess?: () => void;
};

export function ConfirmDelete({
    url,
    title = 'Hapus data?',
    description = 'Tindakan ini tidak bisa dibatalkan.',
    confirmLabel = 'Hapus',
    trigger,
    triggerLabel = 'Hapus',
    onSuccess,
}: Props) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        setProcessing(true);
        router.delete(url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setOpen(false);
                onSuccess?.();
            },
        });
    };

    return (
        <>
            {trigger ? (
                <span onClick={() => setOpen(true)}>{trigger}</span>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
                    onClick={() => setOpen(true)}
                >
                    <Trash2 className="size-4" />
                    {triggerLabel}
                </Button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={submit}
                            disabled={processing}
                        >
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
