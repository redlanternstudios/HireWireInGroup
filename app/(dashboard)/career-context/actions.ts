'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NewCareerContextInput {
	source_type: string
	source_title: string
	role_name: string | null
	company_name: string | null
	date_range: string | null
	responsibilities: string[] | null
	tools_used: string[] | null
	outcomes: string[] | null
}

export interface UpdateCareerContextInput {
}

export async function addCareerContext(input: NewCareerContextInput): Promise<{ success: boolean; error?: string }> {
	let error: Error | null = null
	if (error) return { success: false, error: (error as Error).message }
	revalidatePath('/career-context')
	return { success: true }
}

export async function updateCareerContext(id: string, input: UpdateCareerContextInput): Promise<{ success: boolean; error?: string }> {
	let error: Error | null = null
	if (error) return { success: false, error: (error as Error).message }
	return { success: true }
}
// Placeholder: Will copy and rebrand actions.ts here next.