"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbContext } from "@/app/components/BreadcrumbContext";

const labelMap: Record<string, string> = {
    books: "Llyfrgell",
    create: "Create",
    edit: "Edit",
    admin: "Admin",
    library: "Catalogue",
    stats: "Stats",
    portfolio: "Portfolio",
};

export default function Breadcrumbs() {
    const pathname = usePathname();
    const { bookTitle, returnTo } = useBreadcrumbContext();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) return null;

    const crumbs: { label: string; href: string }[] = [];

    let path = '';
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        path += `/${segment}`;

        if (/^\d+$/.test(segment)) {
            if (bookTitle) {
                crumbs.push({ label: bookTitle, href: path });
            }
            continue;
        }

        crumbs.push({
            label: labelMap[segment] || segment,
            href: returnTo && segment === 'books' ? returnTo : path,
        });
    }

    return (
        <nav
            className="flex items-center gap-1.5 px-3 py-2 text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: 'var(--font-caveat)' }}
        >
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={crumb.href} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-stone-500">/</span>}
                        {isLast ? (
                            <span className="text-amber-200/90">{crumb.label}</span>
                        ) : (
                            <Link href={crumb.href} className="text-stone-300 hover:text-amber-200/80 transition-colors">
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
