'use client'

import { User } from '@supabase/supabase-js'
import {
    LogOut,
    User as UserIcon,
    Settings,
    ChevronRight,
    Store,
    CreditCard,
    Bell,
    HelpCircle,
    MapPin,
    History,
    ShieldCheck,
    Globe,
    Moon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
    user: User
    profile: any
    restaurant?: any
}

export default function ProfileClient({ user, profile, restaurant }: Props) {
    const router = useRouter()
    const { t, locale } = useI18n()
    const { subscribeToPush, updateProfile } = useAuth()
    const supabase = createClient()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const menuItems = [
        {
            label: t.profile.editProfile,
            icon: UserIcon,
            onClick: () => {
                setEditName(profile?.full_name || '')
                setEditPhone(profile?.phone || '')
                setIsEditModalOpen(true)
            }
        },
        { label: t.profile.addresses, icon: MapPin, href: '#' },
        { label: t.profile.paymentMethods, icon: CreditCard, href: '#' },
        { label: t.profile.notifications, icon: Bell, href: '#' },
        { label: t.profile.helpSupport, icon: HelpCircle, href: '#' },
        { label: t.profile.about, icon: Settings, href: '#' },
    ]

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            await updateProfile({ fullName: editName, phone: editPhone })
            setIsEditModalOpen(false)
            toast.success(locale === 'ru' ? 'Профиль обновлен' : 'Профиль жаңартылды')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-muted/30">
            {/* Header */}
            <div className="bg-card px-6 py-8 border-b border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                            {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{profile?.full_name || 'User'}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Restaurant Management - Only if restaurant exists */}
                {restaurant && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Management</p>
                        <Link href="/manage">
                            <Card className="bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <Store className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-primary">{locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}</h3>
                                        <p className="text-xs text-primary/60">Manage your restaurant, menu and orders</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary/30" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                )}

                {/* Profile Actions */}
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Settings</p>
                    <div className="bg-card rounded-3xl border border-border overflow-hidden">
                        {menuItems.map((item, idx) => {
                            const Component = (item as any).href ? Link : 'button'
                            return (
                                <Component
                                    key={idx}
                                    href={(item as any).href}
                                    onClick={(item as any).onClick}
                                    className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left ${idx !== menuItems.length - 1 ? 'border-b border-border/50' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <span className="flex-1 text-sm font-semibold">{item.label}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                                </Component>
                            )
                        })}
                    </div>
                </div>

                {/* Edit Profile Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t.profile.editProfile}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Аты-жөні</Label>
                                <Input
                                    id="name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Атыңызды енгізіңіз"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="+7 (___) ___ __ __"
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Бас тарту
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? 'Сақталуда...' : 'Сақтау'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Хабарламалар</p>
                            <p className="text-xs text-muted-foreground">Жаңалықтар мен тапсырыс күйі</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={subscribeToPush}
                        className="rounded-full px-4 h-8 text-[10px] uppercase font-black tracking-widest"
                    >
                        Қосу
                    </Button>
                </div>

                {/* Sign Out */}
                <Button
                    variant="ghost"
                    className="w-full py-6 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-bold"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-5 h-5" />
                    {t.profile.logout}
                </Button>
            </div>
        </div>
    )
}
