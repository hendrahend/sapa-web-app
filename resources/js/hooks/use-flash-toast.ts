import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const offFlash = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        const offError = router.on('error', (event) => {
            const errors = (event as CustomEvent).detail?.errors;

            if (!errors || Object.keys(errors).length === 0) {
                return;
            }

            toast.error('Periksa kembali form yang kamu isi.');
        });

        return () => {
            offFlash();
            offError();
        };
    }, []);
}
