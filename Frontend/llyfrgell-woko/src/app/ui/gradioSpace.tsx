'use client';

import Script from 'next/script';

export default function GradioSpace() {
    return (
        <>
            <Script
                src="https://gradio.s3-us-west-2.amazonaws.com/5.34.2/gradio.js"
                strategy="beforeInteractive" 
            />
            <gradio-app src="https://littlewoko-llyfrgell-woko-dracula.hf.space"></gradio-app>
        </>
    );
}