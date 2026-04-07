'use client'

import React, { useState } from 'react'
import { Courier } from './courier-utils'
import { toast } from 'sonner'
import { Loader2, Phone, Lock } from 'lucide-react'

interface CourierLoginFormProps {
    onLoginSuccess: (courier: Courier) => void
}

export function CourierLoginForm({ onLoginSuccess }: CourierLoginFormProps) {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/admin/couriers/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            })

            if (!res.ok) {
                const err = await res.json()
                toast.error(err.error || 'Қате кетті')
                setIsLoading(false)
                return
            }

            const data = await res.json()
            onLoginSuccess(data.courier)
        } catch (error) {
            toast.error('Сервермен байланыс жоқ')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Курьер панелі</h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide uppercase">Жүйеге кіріңіз</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                placeholder="Телефон нөмірі"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                required
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                placeholder="Құпиясөз"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Кіру'}
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                        Кіре алмасаңыз, әкімшілікке<br/>хабарласыңыз
                    </p>
                </form>
            </div>
        </div>
    )
}
