"use client";

import { useState } from "react"
import ToggleDrawer from "./toggle-drawer";

interface Props {
    Form: JSX.Element;
}

export default function QuickAdd({ Form }: Props) {
    const [formHidden, setFormHidden] = useState(false);

    function handleToggleForm(): void {
        setFormHidden(!formHidden);
    }

    return (
        <section className="bg-white dark:bg-gray-900 h-auto">
            <div className="relative overflow-hidden transition-all duration-500 ease-in-out">
                <ToggleDrawer click={handleToggleForm} clickText="Quick Create" toggleOn={formHidden} />
                <div className={`${formHidden ? 'max-h-screen' : 'max-h-0'} transition-all duration-500 ease-in-out overflow-hidden`}>
                    {Form}
                </div>
            </div>
        </section>
    )
}