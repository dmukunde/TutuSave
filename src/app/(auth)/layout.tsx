import { LogoMark } from "@/components/brand/logo-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12 [padding-top:max(3rem,calc(env(safe-area-inset-top)+1.5rem))] [padding-bottom:max(3rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark className="size-8" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            TutuSave
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
