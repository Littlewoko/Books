"use client";

import { useState } from "react"
import QuickAddForm from "./quick-add-form";

export default function QuickAdd() {
    const [formHidden, setFormHidden] = useState(false);

    function handleToggleForm(): void {
        setFormHidden(!formHidden);
    }

    return (
        <section className="bg-white dark:bg-gray-900">
            <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Add</h2>
                <button onClick={handleToggleForm}>{formHidden ? "Show" : "Hide"}</button>
                { formHidden ? <QuickAddForm /> : <></>}
            </div>
        </section>
    )
}