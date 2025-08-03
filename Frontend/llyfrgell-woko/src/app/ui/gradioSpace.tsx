'use client';

export default function GradioSpace() {
    return (
        <gradio-app 
            src="https://littlewoko-llyfrgell-woko-dracula.hf.space"
            style={{ 
                width: '100%', // Take full width of its parent
                height: '800px', // Set a fixed height
                minHeight: '800px' // Ensure it doesn't collapse
            }}
        ></gradio-app>
    );
}