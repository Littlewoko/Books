"use client";

import { useState } from "react"
import Form from "./create-form";
import QuickAddHidden from "./quick-add-hidden";
export default function QuickAdd() {
    const [formHidden, setFormHidden] = useState(false);

    function handleToggleForm(): void {
        setFormHidden(!formHidden);
    }

    return (
        <section className="bg-white dark:bg-gray-900 h-auto">
            <div className="relative overflow-hidden transition-all duration-500 ease-in-out">
                <div className={`${formHidden ? 'max-h-0' : 'max-h-screen'} transition-all duration-200 ease-in-out overflow-hidden`}>
                    <QuickAddHidden click={handleToggleForm} clickText="Quick Create" />
                </div>
                <div className={`${formHidden ? 'max-h-screen' : 'max-h-0'} transition-all duration-400 ease-in-out overflow-hidden`}>
                    <Form action={handleToggleForm} actionText="Collapse"/>
                </div>
            </div>
        </section>
    )
}