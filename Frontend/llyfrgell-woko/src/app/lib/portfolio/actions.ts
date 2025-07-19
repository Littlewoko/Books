'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ProtectRoute from '@/app/utils/protectRoute';
import { Portfolio } from '../classes/portfolio';
import { convertToPortfolio } from './data';

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

export async function editPortfolio(id: number, userId: string, formData: FormData) {
    await ProtectRoute();

    const portfolio: Portfolio = getPortfolioFromFormData(formData, userId);
    portfolio.id = id;

    await sql`
    UPDATE portfolio 
    SET title=${portfolio.title}, 
    description=${portfolio.description}, 
    url=${portfolio.url}, 
    svg_icon=${portfolio.svgIcon}
    WHERE
    id=${portfolio.id}
    `

    revalidatePath('/');
    redirect('/');
}

export async function deletePortfolio(id: string) {
    await ProtectRoute();

    await sql`DELETE FROM portfolio WHERE id=${id}`

    revalidatePath('/');
    redirect('/');
}

export async function fetchUserPortfolio(userId: string) {
    const result = await sql`SELECT * FROM portfolio WHERE user_id=${userId};`;

    return convertToPortfolio(result);
}

export async function fetchUserPortfolioById(id: string, userId: string) {
    const result = await sql`SELECT * FROM portfolio WHERE user_id=${userId} AND id=${id};`;

    return convertToPortfolio(result)[0];
}


