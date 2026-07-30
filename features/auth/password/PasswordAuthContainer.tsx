import AppLogo from '@/features/auth/login/components/AppLogo';
import SignInForm from './components/SignInForm';

export default function PasswordAuthContainer() {
  return (
    <main className="flex-1 flex flex-col justify-between h-full px-6 py-8 bg-surface-l2">
      <AppLogo />

      <div className="w-full max-w-sm mx-auto my-auto">
        <SignInForm />
      </div>

      <div className="pb-4 text-center">
        <p className="text-[11px] text-zinc-400 font-sans">
          ورود شما به معنای پذیرش شرایط و قوانین inShop است.
        </p>
      </div>
    </main>
  );
}
