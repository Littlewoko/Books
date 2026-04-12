"use client";

import {useEffect} from "react";

export default function PersistStorage() {
    useEffect(() => {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist();
        }
    }, []);
    return null;
}
