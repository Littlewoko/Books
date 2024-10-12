'use server';

import { signOut } from '../../../auth';
import { signIn } from '../../../auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    formData: FormData
) {
    try {
        await signIn('credentials', formData);
    } catch(error) {
        throw error;
    }
}

export async function logOut() {
    await signOut();
}