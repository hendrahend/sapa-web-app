import { ModulePage } from '@/components/sapa/module-page';

export default function NotificationsIndex() {
    return (
        <ModulePage
            title="Notifikasi"
            eyebrow="Kabar untuk orang tua"
            summary="Kelola pemberitahuan absensi, keterlambatan, nilai, dan aktivitas penting siswa."
            stats={[
                { label: 'Terkirim hari ini', value: '0' },
                { label: 'Menunggu kirim', value: '0' },
                { label: 'Gagal kirim', value: '0' },
            ]}
        />
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Notifikasi',
            href: '/notifications',
        },
    ],
};
