"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (res.ok) {
      router.push('/admin');
    } else {
      const j = await res.json();
      setError(j?.error || 'Login failed');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={submit} className="bg-black/20 p-8 rounded space-y-4 w-full max-w-sm">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {error && <div className="text-red-400">{error}</div>}
        <input required placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 text-white border border-white rounded" />
        <input required type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 text-white border border-white rounded" />
        <button className="w-full bg-orange-500 p-2 rounded">Entrar</button>
      </form>
    </main>
  );
}
