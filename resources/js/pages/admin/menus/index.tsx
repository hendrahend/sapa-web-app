import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    KeyRound,
    ListTree,
    Menu as MenuIcon,
    Pencil,
    Plus,
    Route,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDelete } from '@/components/sapa/confirm-delete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type MenuRow = {
    id: number;
    parent_id: number | null;
    parent_title: string | null;
    title: string;
    route: string | null;
    icon: string | null;
    permission_name: string | null;
    order: number;
    is_visible: boolean;
    is_active: boolean;
};

type ParentOption = {
    id: number;
    title: string;
};

type Props = {
    menuItems: MenuRow[];
    parents: ParentOption[];
    permissions: string[];
    stats: {
        totalMenus: number;
        visibleMenus: number;
        protectedMenus: number;
    };
};

type MenuForm = {
    parent_id: string;
    title: string;
    route: string;
    icon: string;
    permission_name: string;
    order: number;
    is_visible: boolean;
    is_active: boolean;
};

const emptyForm: MenuForm = {
    parent_id: 'none',
    title: '',
    route: '',
    icon: '',
    permission_name: 'none',
    order: 0,
    is_visible: true,
    is_active: true,
};

const commonIcons = [
    'LayoutGrid',
    'ClipboardCheck',
    'GraduationCap',
    'BookOpen',
    'Sparkles',
    'Award',
    'Bell',
    'Users',
    'IdCard',
    'School',
    'ShieldCheck',
    'MapPinned',
    'Store',
    'Menu',
    'Settings',
];

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Total menu',
            value: stats.totalMenus,
            icon: MenuIcon,
        },
        {
            label: 'Tampil',
            value: stats.visibleMenus,
            icon: Eye,
        },
        {
            label: 'Dengan permission',
            value: stats.protectedMenus,
            icon: KeyRound,
        },
    ];
}

export default function AdminMenusIndex({
    menuItems,
    parents,
    permissions,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canCreateMenus = auth.permissions.includes('menus.create');
    const canUpdateMenus = auth.permissions.includes('menus.update');
    const canDeleteMenus = auth.permissions.includes('menus.delete');
    const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm<MenuForm>(emptyForm);
    const editingMenu =
        menuItems.find((menu) => menu.id === editingMenuId) ?? null;
    const parentOptions = useMemo(
        () => parents.filter((parent) => parent.id !== editingMenuId),
        [parents, editingMenuId],
    );
    const rootMenus = menuItems.filter((menu) => menu.parent_id === null);

    function resetForm() {
        setEditingMenuId(null);
        setIsFormOpen(false);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function addMenu() {
        setEditingMenuId(null);
        form.clearErrors();
        form.setData({
            ...emptyForm,
            order:
                menuItems.length > 0
                    ? Math.max(...menuItems.map((m) => m.order)) + 10
                    : 10,
        });
        setIsFormOpen(true);
    }

    function editMenu(menu: MenuRow) {
        setEditingMenuId(menu.id);
        form.clearErrors();
        form.setData({
            parent_id: menu.parent_id ? String(menu.parent_id) : 'none',
            title: menu.title,
            route: menu.route ?? '',
            icon: menu.icon ?? '',
            permission_name: menu.permission_name ?? 'none',
            order: menu.order,
            is_visible: menu.is_visible,
            is_active: menu.is_active,
        });
        setIsFormOpen(true);
    }

    function changeFormOpen(open: boolean) {
        setIsFormOpen(open);

        if (!open) {
            resetForm();
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = {
            ...form.data,
            parent_id:
                form.data.parent_id === 'none' ? '' : form.data.parent_id,
            permission_name:
                form.data.permission_name === 'none'
                    ? ''
                    : form.data.permission_name,
        };
        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        form.transform(() => payload);

        if (editingMenuId) {
            form.put(`/admin/menus/${editingMenuId}`, options);

            return;
        }

        form.post('/admin/menus', options);
    }

    return (
        <>
            <Head title="Menu Manager" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Pengaturan navigasi
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Menu Manager
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Kelola struktur menu, icon, route, permission, dan
                        visibilitas sidebar dari satu tempat.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {statItems(stats).map((item) => (
                        <div key={item.label} className="sapa-soft-card p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                    {item.label}
                                </p>
                                <item.icon className="size-4 text-primary" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="sapa-card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Daftar menu
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {rootMenus.length} group utama,{' '}
                                {menuItems.length} menu terdaftar.
                            </p>
                        </div>
                        {canCreateMenus && (
                            <Button type="button" onClick={addMenu}>
                                <Plus />
                                Tambah menu
                            </Button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Menu
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Parent
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Route
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Permission
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {menuItems.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-muted-foreground"
                                        >
                                            Belum ada menu.
                                        </td>
                                    </tr>
                                )}

                                {menuItems.map((menu) => (
                                    <tr key={menu.id}>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-start gap-2">
                                                <ListTree className="mt-0.5 size-4 text-primary" />
                                                <div>
                                                    <p className="font-medium">
                                                        {menu.title}
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        Icon: {menu.icon ?? '-'}{' '}
                                                        / Order: {menu.order}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {menu.parent_title ?? 'Root group'}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <span className="inline-flex items-center gap-2">
                                                <Route className="size-4 text-muted-foreground" />
                                                {menu.route ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {menu.permission_name ? (
                                                <Badge variant="outline">
                                                    {menu.permission_name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Public auth
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge
                                                    variant={
                                                        menu.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {menu.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        menu.is_visible
                                                            ? 'outline'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {menu.is_visible ? (
                                                        <Eye className="size-3" />
                                                    ) : (
                                                        <EyeOff className="size-3" />
                                                    )}
                                                    {menu.is_visible
                                                        ? 'Tampil'
                                                        : 'Hidden'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap gap-2">
                                                {canUpdateMenus && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            editMenu(menu)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDeleteMenus && (
                                                    <ConfirmDelete
                                                        url={`/admin/menus/${menu.id}`}
                                                        title={`Hapus menu ${menu.title}?`}
                                                        description="Menu yang masih memiliki child tidak bisa dihapus."
                                                        triggerLabel="Hapus"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <Dialog open={isFormOpen} onOpenChange={changeFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={submit} className="grid gap-5">
                        <DialogHeader>
                            <DialogTitle>
                                {editingMenu ? 'Edit menu' : 'Tambah menu'}
                            </DialogTitle>
                            <DialogDescription>
                                Parent kosong akan tampil sebagai group sidebar.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Judul</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Parent</Label>
                                <Select
                                    value={form.data.parent_id}
                                    onValueChange={(value) =>
                                        form.setData('parent_id', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Root group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Root group
                                        </SelectItem>
                                        {parentOptions.map((parent) => (
                                            <SelectItem
                                                key={parent.id}
                                                value={String(parent.id)}
                                            >
                                                {parent.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.parent_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="route">Route</Label>
                                <Input
                                    id="route"
                                    placeholder="/admin/menus"
                                    value={form.data.route}
                                    onChange={(event) =>
                                        form.setData(
                                            'route',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.route} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Icon</Label>
                                <Select
                                    value={form.data.icon || 'none'}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'icon',
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Tanpa icon
                                        </SelectItem>
                                        {commonIcons.map((icon) => (
                                            <SelectItem key={icon} value={icon}>
                                                {icon}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.icon} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Permission</Label>
                                <Select
                                    value={form.data.permission_name}
                                    onValueChange={(value) =>
                                        form.setData('permission_name', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tanpa permission" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Tanpa permission
                                        </SelectItem>
                                        {permissions.map((permission) => (
                                            <SelectItem
                                                key={permission}
                                                value={permission}
                                            >
                                                {permission}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.permission_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="order">Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    min={0}
                                    value={form.data.order}
                                    onChange={(event) =>
                                        form.setData(
                                            'order',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                                <InputError message={form.errors.order} />
                            </div>

                            <div className="flex items-center gap-6 self-end rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={form.data.is_visible}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'is_visible',
                                                checked === true,
                                            )
                                        }
                                    />
                                    Tampil
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={form.data.is_active}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'is_active',
                                                checked === true,
                                            )
                                        }
                                    />
                                    Aktif
                                </label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                disabled={form.processing}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
