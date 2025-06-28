'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      // role-based redirect bisa disimpan di session atau ambil ulang di client
      router.push('/'); // sementara push ke dashboard, nanti kita bikin redirect role-based
    } else {
      toast.error('Email atau Password salah!');
    }
  };

  return (
    <div className="flex w-full h-screen justify-center">
      <div className="w-3/5 hidden md:block">
        <Image
          className="w-full h-full object-cover"
          src={'/assetLogin.png'}
          width={500}
          height={500}
          alt="asset"
        ></Image>
      </div>
      <div className="w-full md:w-2/5 flex flex-col justify-center px-10">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-start">Login to KEDCOMP</h1>
          <h5>Log in to your account!</h5>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Login to your account!
          </button>
        </form>
      </div>
    </div>
  );
}
