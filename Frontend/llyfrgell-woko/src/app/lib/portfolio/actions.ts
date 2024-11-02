'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ProtectRoute from '@/app/utils/protectRoute';
import { Portfolio } from '../classes/portfolio';

function getPortfolioFromFormData(formData: FormData, userId: string): Portfolio {
    const svg = formData.get('svg-icon') as string;
    const encodedSvg = Buffer.from(svg).toString('base64')
    
    const portfolio: Portfolio = {
        userId: userId,
        title: formData.get('title') as string,
        url: formData.get('url') as string,
        description: formData.get('description') as string,
        svgIcon: encodedSvg
    };

    return portfolio;
}

export async function createPortfolio(userId: string, formData: FormData) {
    await ProtectRoute();

    const portfolio: Portfolio = getPortfolioFromFormData(formData, userId);

    await sql`INSERT INTO portfolio (user_id, title, url, description, svg_icon)
        VALUES (
        ${portfolio.userId}, 
        ${portfolio.title}, 
        ${portfolio.url}, 
        ${portfolio.description}, 
        ${portfolio.svgIcon}    
        );`

    revalidatePath('/');
    redirect('/');
}


