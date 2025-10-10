import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession } from '../../lib/adminSession';

import AdminClient from './AdminClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('a_token')?.value;
  
  if (!token || !validateSession(token)) {
    redirect('/admin/login');
  }

  return <AdminClient />;
}
