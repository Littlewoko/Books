import Link from 'next/link';
import AuthButton from './authButton';

export function DesktopNavLinks() {
  return (
    <ul className="absolute right-0 flex flex-row space-x-6">
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <Link href="/">Home</Link>
      </li>
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <Link href="/books">Books</Link>
      </li>
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <Link href="/books/create">Add New Book</Link>
      </li>
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <AuthButton />
      </li>
    </ul>
  );
}