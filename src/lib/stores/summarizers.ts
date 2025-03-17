import { writable } from 'svelte/store';

/**
 * SummarizerConfig:
 * - `modelType`: 'openai' | 'ollama'
 * - `knowledgeBaseIds`: local references for RAG retrieval
 * - `files?`: array for your local references (if you want).
 * - `noStream?`: to toggle streaming or not.
 */
export interface SummarizerConfig {
	id: string;
	name: string;
	modelType: 'openai' | 'ollama';
	modelId: string;
	knowledgeBaseIds: string[];
	instructions: string;
	isEditing?: boolean;

	topK?: number;
	chunkSize?: number;
	chunkOverlap?: number;

	noStream?: boolean;

	files?: Array<{
		type: string;
		id?: string;
		name?: string;
		collection_name?: string;
		url?: string;
		status?: string;
		chunk_size?: number;
		chunk_overlap?: number;
	}>;
}

export const summarizersStore = writable<SummarizerConfig[]>([]);

export function addSummarizer(newSumm: SummarizerConfig) {
	summarizersStore.update((list) => [...list, newSumm]);
}

export function removeSummarizer(id: string) {
	summarizersStore.update((list) => list.filter((s) => s.id !== id));
}

export function updateSummarizer(id: string, changes: Partial<SummarizerConfig>) {
	summarizersStore.update((list) =>
		list.map((s) => (s.id === id ? { ...s, ...changes } : s))
	);
}