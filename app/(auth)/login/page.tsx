import { AuthScreen } from '@/components/auth/AuthScreen';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return <AuthScreen mode="login" authError={searchParams.error} next={searchParams.next} />;
}
