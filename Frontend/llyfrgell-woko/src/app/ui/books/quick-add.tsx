"use client";

import { useState } from "react"
import Form from "./create-form";

export default function QuickAdd() {
    const [formHidden, setFormHidden] = useState(false);

    function handleToggleForm(): void {
        setFormHidden(!formHidden);
    }

    return (
        <section className="bg-white dark:bg-gray-900">
            <div>
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Add</h2>
                <button onClick={handleToggleForm}>{formHidden ? "Hide" : "Show"}</button>
                { formHidden ? <Form /> : <></>}
            </div>
        </section>
    )
}