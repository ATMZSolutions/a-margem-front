"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer({ textoCopyright, textoDireitos }: { textoCopyright: string; textoDireitos: string }) {
    const pathname = usePathname();

    if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

    return (
        <footer className="bg-black text-white/50 text-center py-5 text-sm">
            <div>{textoCopyright}</div>
            <div>{textoDireitos}</div>
        </footer>
    );
}
