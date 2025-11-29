//app/(auth)/page.tsx

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // if using shadcn-ui
// If you don’t have this, you can just use a regular <button> with classes

export default function Home() {
  const router = useRouter();

  // Function to handle navigation to the sign-in page
  const handleSignIn = () => {
    router.push("/sign-in");
  };

  //Function to navigate do "/dashboard" after sign in
  const handleDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">

      {/* Utilize the functions above */}
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="Logo"
          width={150}
          height={150}
          className="mb-4"
        />
        <h1 className="text-4xl font-bold text-center">
          Welcome to Our Application
        </h1>
        <p className="text-lg text-center max-w-md">
          Please sign in to access your dashboard and manage your account.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleSignIn} className="px-6 py-3">
            Sign In
          </Button>
          <Button onClick={handleDashboard} variant="secondary" className="px-6 py-3">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
