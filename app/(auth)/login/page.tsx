import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | DOYA Training Platform",
  description: "Sign in to your DOYA Training Platform account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="card-modern p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-brand-secondary dark:text-slate-100">
              DOYA Training Platform
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400">
              Sign in to your account
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-neutral-600 dark:text-slate-400">
            <p>
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-medium text-brand-primary hover:underline"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

