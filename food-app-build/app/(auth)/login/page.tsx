'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signInWithCustomOtp, verifyCustomOtp, signInAnonymous, loading: authLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [loading, setLoading] = useState(false)

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !fullName || !phone) {
            toast.error('Барлық өрістерді толтырыңыз')
            return
        }
        setLoading(true)
        try {
            await signInWithCustomOtp(email, fullName, phone)
            setStep('otp')
            toast.success('Код почтаңызға жіберілді')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) return
        setLoading(true)
        try {
            await verifyCustomOtp(email, otp)
            const next = searchParams.get('next') || '/'
            router.push(next)
            toast.success('Қош келдіңіз!')
        } catch (error: any) {
            toast.error('Код қате немесе уақыты өтіп кеткен')
        } finally {
            setLoading(false)
        }
    }

    const handleAnonymousLogin = async () => {
        setLoading(true)
        try {
            await signInAnonymous()
            toast.success('Сіз қонақ ретінде кірдіңіз')
            router.push('/')
        } catch (error: any) {
            toast.error('Қате: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-black uppercase tracking-tight">Кіру</CardTitle>
                    <CardDescription className="font-medium italic">
                        Тапсырыс беру үшін жүйеге кіріңіз
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-10">
                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Толық атыңыз
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Мысалы: Бекболат"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="h-14 rounded-2xl bg-muted/50 border-none px-6 text-base font-bold"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Email
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="example@mail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 rounded-2xl bg-muted/50 border-none px-6 text-base font-bold"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Телефон нөмірі
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="+7 707 000 00 00"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-14 rounded-2xl bg-muted/50 border-none px-6 text-base font-bold"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-4" disabled={loading}>
                                {loading ? 'Жіберілуде...' : 'Кодты алу'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2 text-center">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    Растау коды (Email-ге жіберілді)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="h-16 rounded-2xl bg-muted/50 border-none px-4 text-2xl font-black text-center tracking-[0.5em]"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg" disabled={loading}>
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Растау'}
                            </Button>
                            <Button
                                variant="link"
                                type="button"
                                className="w-full text-xs font-bold text-muted-foreground"
                                onClick={() => setStep('email')}
                                disabled={loading}
                            >
                                Деректерді өзгерту
                            </Button>
                        </form>
                    )}

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-background px-4 text-muted-foreground italic">немесе</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl font-bold border-2 border-dashed"
                        onClick={handleAnonymousLogin}
                        disabled={loading}
                    >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Тіркелмей жалғастыру
                    </Button>
                </CardContent>
                <CardFooter className="text-center text-[10px] font-medium text-muted-foreground pb-8 px-8 leading-relaxed italic">
                    Жүйеге кіру арқылы сіз біздің пайдалану шарттарымен және құпиялылық саясатымен келісесіз
                </CardFooter>
            </Card>
        </div>
    )
}
