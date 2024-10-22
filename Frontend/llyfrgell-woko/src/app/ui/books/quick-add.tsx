"use client";

import { useState } from "react"
import Form from "./create-form";
import QuickAddHidden from "./quick-add-hide";
export default function QuickAdd() {
    const [formHidden, setFormHidden] = useState(false);

    function handleToggleForm(): void {
        setFormHidden(!formHidden);
    }

    return (
        <section className="bg-white dark:bg-gray-900">
            <div>
                { formHidden ? <Form /> : <QuickAddHidden click={handleToggleForm} />}
            </div>
        </section>
    )
}