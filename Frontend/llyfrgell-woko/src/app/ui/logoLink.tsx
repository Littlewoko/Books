import Link from 'next/link';
export function LogoLink() {
  return (
    <div className="mb-4 text-center sm:mb-0">
      <Link href="/">
        <div className="bg-black h-10 w-10"></div>
      </Link>
    </div>
  );
}