"use client";

import dynamic from "next/dynamic";
import { Book } from "@/app/lib/classes/book";

const Library3D = dynamic(() => import("./library-3d"), { ssr: false });

export default function Library3DWrapper({ books }: { books: Book[] }) {
    return <Library3D books={books} />;
}
