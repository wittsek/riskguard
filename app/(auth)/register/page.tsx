import { AuthScreen } from '@/components/auth/AuthScreen';

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <AuthScreen mode="register" next={searchParams.next} />;
}
