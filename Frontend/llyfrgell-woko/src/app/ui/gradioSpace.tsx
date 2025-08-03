'use client';

import Script from "next/script";

export default function GradioSpace() {
    return (
        <>
            <Script
                type="module"
                src="https://gradio.s3-us-west-2.amazonaws.com/5.34.2/gradio.js"
            ></Script>
            <gradio-app 
                space="https://littlewoko-llyfrgell-woko-dracula.hf.space"
                style={{ 
                    width: '100%', // Take full width of its parent
                    height: '800px', // Set a fixed height
                    minHeight: '800px' // Ensure it doesn't collapse
                }}
            ></gradio-app>
        </>
    );
}