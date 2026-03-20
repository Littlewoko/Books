"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface BreadcrumbProps {
    bookTitle?: string;
}

const labelMap: Record<string, string> = {
    books: "Llyfrgell",
    create: "Create",
    edit: "Edit",
    admin: "Admin",
    stats: "Stats",
    portfolio: "Portfolio",
};

export default function Breadcrumbs({ bookTitle }: BreadcrumbProps) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) return null;

    const crumbs: { label: string; href: string }[] = [];

    let path = '';
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        path += `/${segment}`;

        // Skip raw IDs — use book title instead
        if (/^\d+$/.test(segment) && bookTitle) {
            crumbs.push({ label: bookTitle, href: path });
        } else {
            crumbs.push({
                label: labelMap[segment] || segment,
                href: path,
            });
        }
    }

    return (
        <nav className="flex items-center gap-1 px-2 py-2 text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={crumb.href} className="flex items-center gap-1">
                        {i > 0 && <ChevronRightIcon className="text-gray-500" sx={{ fontSize: '14px' }} />}
                        {isLast ? (
                            <span className="text-orange-500">{crumb.label}</span>
                        ) : (
                            <Link href={crumb.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
