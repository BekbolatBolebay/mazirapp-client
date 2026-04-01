'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    Globe,
    Moon,
    ShieldCheck as VerifiedIcon,
    LogIn,
    Heart,
    ShoppingBag,
    Star,
    Share2,
    CheckCircle2,
    ChevronLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
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

interface Props {
    user: User
    profile: any
    restaurant?: any
}

export default function ProfileClient({ user, profile, restaurant }: Props) {
    const router = useRouter()
    const { t, locale, setLocale } = useI18n()
    const { subscribeToPush, updateProfile } = useAuth()
    const supabase = createClient()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    
    // Stats and Active Order
    const [orderCount, setOrderCount] = useState<number | null>(null)
    const [favoritesCount, setFavoritesCount] = useState<number | null>(null)
    const [activeOrder, setActiveOrder] = useState<any>(null)

    useEffect(() => {
        if (!user || user.is_anonymous) return

        const fetchStats = async () => {
            // Fetch total orders
            const { count: oCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            setOrderCount(oCount || 0)

            // Fetch total favorites
            const { count: fCount } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            setFavoritesCount(fCount || 0)

            // Fetch latest active order
            const { data: latestOrder } = await supabase
                .from('orders')
                .select('id, order_number, status, total_amount, created_at')
                .eq('user_id', user.id)
                .in('status', ['pending', 'preparing', 'ready', 'delivering', 'on_the_way'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (latestOrder) {
                setActiveOrder(latestOrder)
            }
        }

        fetchStats()
    }, [user, supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const menuItems = [
        {
            label: t.profile.editProfile,
            icon: UserIcon,
            color: 'bg-primary',
            onClick: () => {
                setEditName(profile?.full_name || '')
                setEditPhone(profile?.phone || '')
                setIsEditModalOpen(true)
            }
        },
        { label: t.common.orders, icon: ShoppingBag, color: 'bg-indigo-600', href: '/orders' },
        { label: t.common.favorites, icon: Heart, color: 'bg-rose-500', href: '/favorites' },
        { label: t.profile.addresses, icon: MapPin, color: 'bg-orange-500', href: '#' },
        { label: t.profile.paymentMethods, icon: CreditCard, color: 'bg-emerald-500', href: '#' },
        { label: t.profile.notifications, icon: Bell, color: 'bg-indigo-500', href: '#' },
        { label: t.profile.helpSupport, icon: HelpCircle, color: 'bg-slate-500', href: '#' },
        { label: t.profile.about, icon: Settings, color: 'bg-slate-400', href: '#' },
    ]

    const isGuest = user.is_anonymous

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

    const filteredMenuItems = isGuest
        ? menuItems.filter(item => ['Help & Support', 'About', t.profile.helpSupport, t.profile.about].includes(item.label))
        : menuItems

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-[#F8F9FB] dark:bg-background">
            {/* Premium App Bar */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 h-16 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-black tracking-tight">{t.profile.title}</h1>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <History className="w-5 h-5 text-muted-foreground" onClick={() => router.push('/orders')} />
                </Button>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col"
            >
                {/* Profile Header Card */}
                <motion.div variants={itemVariants} className="px-5 pt-6">
                    <Card className="relative overflow-hidden border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-700">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                        
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <Avatar className="w-20 h-20 border-4 border-white/20 shadow-xl transition-transform duration-500 group-hover:scale-105">
                                        <AvatarImage src={profile?.avatar_url} />
                                        <AvatarFallback className="bg-white/10 text-white text-3xl font-black backdrop-blur-md">
                                            {isGuest ? '?' : (profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase())}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isGuest && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <VerifiedIcon className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                    <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                                        {isGuest ? (locale === 'kk' ? 'Қонақ' : 'Гость') : (profile?.full_name || 'User')}
                                    </h2>
                                    <p className="text-sm text-white/70 font-medium truncate max-w-[180px]">
                                        {isGuest
                                            ? (locale === 'kk' ? 'Тіркелмеген қолданушы' : 'Неавторизованный пользователь')
                                            : user.email
                                        }
                                    </p>
                                    {!isGuest && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider mt-2">
                                            <Star className="w-3 h-3 fill-current" />
                                            {locale === 'kk' ? 'Тұрақты клиент' : 'Постоянный клиент'}
                                        </div>
                                    )}
                                </div>

                                {!isGuest && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-white hover:bg-white/10 rounded-full"
                                        onClick={() => setIsEditModalOpen(true)}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>

                            {/* Stats Bar */}
                            {!isGuest && (
                                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">{orderCount ?? '...'}</p>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t.common.orders}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">{favoritesCount ?? '...'}</p>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t.common.favorites}</p>
                                    </div>
                                </div>
                            )}

                            {isGuest && (
                                <div className="space-y-6">
                                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-inner bg-white/5 border border-white/10">
                                        <img 
                                            src="/images/illustrations/guest-profile-bg.png" 
                                            alt="Join Us" 
                                            className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    </div>
                                    <Button
                                        className="w-full bg-primary text-white hover:bg-primary/90 rounded-2xl h-12 font-black transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                                        onClick={() => router.push('/login')}
                                    >
                                        <LogIn className="w-5 h-5 mr-2" />
                                        {locale === 'kk' ? 'Тіркелу' : 'Зарегистрироваться'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="px-5 py-6 space-y-6">
                    {/* Active Order Tracker */}
                    <AnimatePresence>
                        {activeOrder && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {locale === 'kk' ? 'Белсенді тапсырыс' : 'Активный заказ'}
                                    </p>
                                    <p className="text-[10px] font-bold text-primary uppercase">
                                        {activeOrder.order_number}
                                    </p>
                                </div>
                                <Card 
                                    className="bg-white dark:bg-zinc-900 border-none shadow-xl shadow-primary/5 cursor-pointer rounded-[2rem] overflow-hidden"
                                    onClick={() => router.push(`/orders/${activeOrder.id}`)}
                                >
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                                            <ShoppingBag className="w-6 h-6 text-primary" />
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm capitalize">
                                                {t.orders.status[activeOrder.status as keyof typeof t.orders.status] || activeOrder.status}
                                            </h4>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {activeOrder.total_amount}₸ • {new Date(activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <Button size="sm" className="rounded-xl h-9 font-black px-4 shadow-lg shadow-primary/20">
                                            {locale === 'kk' ? 'Қадағалау' : 'Следить'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Restaurant Management */}
                    {restaurant && (
                        <motion.div variants={itemVariants} className="space-y-3">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Management</p>
                            <Link href="/manage">
                                <Card className="bg-card hover:shadow-lg transition-all border border-primary/20 rounded-[2rem] overflow-hidden">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Store className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-sm">{locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}</h3>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Manage Restaurant & Menu</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    )}

                    {/* Main Menu Sections */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shadow-sm">
                            {filteredMenuItems.map((item, idx) => {
                                const Component = (item as any).href ? Link : 'button'
                                return (
                                    <Component
                                        key={idx}
                                        href={(item as any).href as any}
                                        onClick={(item as any).onClick}
                                        className={`w-full flex items-center gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group ${idx !== filteredMenuItems.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:rotate-3 shadow-md",
                                            item.color || 'bg-zinc-400'
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 text-[13px] font-black tracking-tight">{item.label}</span>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors" />
                                    </Component>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Language Selection */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{t.common.language}</p>
                        <div className="flex gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                            {[
                                { code: 'kk', label: 'Kazakh' },
                                { code: 'ru', label: 'Russian' },
                                { code: 'en', label: 'English' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    className={cn(
                                        "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        locale === lang.code 
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                            : "text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    )}
                                    onClick={() => setLocale(lang.code as any)}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Push Notifications Toggle */}
                    <motion.div variants={itemVariants}>
                         <Card className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black">{locale === 'kk' ? 'Хабарламалар' : 'Уведомления'}</p>
                                        <p className="text-[11px] text-muted-foreground font-medium">{locale === 'kk' ? 'Жұмыс күйін бақылау' : 'Следите за статусом'}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={subscribeToPush}
                                    className="rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-wider"
                                >
                                    {locale === 'kk' ? 'Қосу' : 'Включить'}
                                </Button>
                            </CardContent>
                         </Card>
                    </motion.div>

                    {/* Version & Logout */}
                    <motion.div variants={itemVariants} className="pt-4 space-y-4">
                        <Button
                            variant="ghost"
                            className="w-full py-7 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-2 font-black text-sm group"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            {t.profile.logout}
                        </Button>
                        
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
                                Məzir App v2.4.0
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Edit Profile Modal - Improved Styling */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-sm rounded-[2.5rem] p-8">
                    <DialogHeader>
                        <div className="bg-primary p-8 text-white -mx-8 -mt-8 mb-4 rounded-t-[2rem]">
                            <h2 className="text-2xl font-black tracking-tight">{t.profile.editProfile}</h2>
                            <p className="text-white/70 text-sm font-medium">{t.common.edit}</p>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {locale === 'kk' ? 'Аты-жөні' : 'Полное имя'}
                            </Label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-14 pl-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-primary/20 font-bold"
                                    placeholder={locale === 'kk' ? 'Атыңызды енгізіңіз' : 'Введите имя'}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {locale === 'kk' ? 'Телефон' : 'Телефон'}
                            </Label>
                            <Input
                                id="phone"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="h-14 rounded-2xl font-bold bg-zinc-50 dark:bg-zinc-950 border-none px-5"
                                placeholder="+7 (700) 000-00-00"
                                required
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="flex-1 h-14 rounded-2xl font-black"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                {t.common.cancel}
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isUpdating}
                                className="flex-[1.5] h-14 rounded-2xl font-black bg-primary shadow-lg shadow-primary/20"
                            >
                                {isUpdating ? (t.common.loading || '...') : t.common.save}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
