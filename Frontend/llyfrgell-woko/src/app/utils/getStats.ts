'use server'

import { Stats } from "../lib/classes/stats";
import { GetStatsRequest } from "../lib/books/sql";

export async function getStats() {
    let stats: Stats | null = null;
    try {
        const result = await GetStatsRequest();

        const { inprogress, completedcount, shortstorycount, completedthisyearcount, shortstorythisyearcount } = result.rows[0];
        stats = {
            inProgress: inprogress, 
            allTimeComplete: completedcount, 
            allTimeCompleteShort: shortstorycount, 
            thisYearComplete: completedthisyearcount, 
            thisYearCompleteShort: shortstorythisyearcount
        }
    } catch (error) {
        console.log(error);
    }
    
    return stats;
}