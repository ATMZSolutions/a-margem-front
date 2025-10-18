"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <main
      style={{ backgroundImage: 'url(/padrao2.webp)' }}
      className="min-h-screen p-8 flex gap-10 justify-center flex-col items-center bg-[#412551] text-white"
    >
      <div className='w-full max-w-sm'>
        <h1 className="text-2xl lg:text-4xl border-b-3 border-[#F38901] font-sedgwick">Admin</h1>
        <form onSubmit={submit} className="bg-black/40 flex flex-col p-8 items-center rounded space-y-4 w-full max-w-sm">
          <h1 className="text-xl lg:text-3xl tracking-wider font-sedgwick font-normal font-bold">Login</h1>
          {error && <div className="text-red-400">{error}</div>}
          <input required placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 text-white border border-white rounded" />
          <div className="relative w-full">
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 text-white border border-white rounded pr-10"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition"
            >
              {showPassword ? <EyeInvisibleOutlined style={{ color: 'black' }} /> : <EyeOutlined style={{ color: 'black' }} />}
            </button>
          </div>
          <button className="w-full cursor-pointer bg-[#f38901] p-2 rounded">Entrar</button>
        </form>
      </div>
    </main>
  );
}
