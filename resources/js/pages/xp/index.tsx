import { ModulePage } from '@/components/sapa/module-page';

export default function XpIndex() {
    return (
        <ModulePage
            title="XP"
            eyebrow="Progres dan apresiasi"
            summary="Kelola poin pengalaman, level, badge, dan pencapaian belajar siswa."
            stats={[
                { label: 'XP diberikan', value: '0' },
                { label: 'Badge aktif', value: '0' },
                { label: 'Level naik', value: '0' },
            ]}
        />
    );
}

XpIndex.layout = {
    breadcrumbs: [
        {
            title: 'XP',
            href: '/xp',
        },
    ],
};
