import { redirect } from 'next/navigation';

export default function CustomerInvoicesRedirect() {
  redirect('/customer/dashboard/invoices');
}

