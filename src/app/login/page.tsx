'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
    });
  }

  return (
    <div className="flex w-full h-screen justify-center">
      <div className="w-3/5">
        <Image
          className="w-full h-full object-cover"
          src={'/assetLogin.png'}
          width={500}
          height={500}
          alt="asset"
        ></Image>
      </div>
      <div className="w-2/5 flex flex-col justify-center px-10">
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
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
