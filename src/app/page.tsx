import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/tokens');
  return null;
}
