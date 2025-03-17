<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';

	import { summarizersStore, addSummarizer, removeSummarizer } from '$lib/stores/summarizers';
	import { generateSummary } from '$lib/apis/summarizers';
	import SummarizerCard from './SummarizerCard.svelte';

	import type { SummarizerConfig } from '$lib/stores/summarizers';

	export let token: string;
	export let allModels: { id: string; name: string; owned_by: string }[] = [];
	export let allKnowledgeBases: { id?: string; collection_name: string; name: string }[] = [];

	/**
	 * Called when a summarizer completes its summary
	 * so the parent can inject the text back into the chat.
	 */
	export let onSummaryComplete: (summId: string, summaryText: string, sources?: any[]) => void;

	/**
	 * We pass in the current selected Summarizer’s ID from the parent
	 * so we can highlight the selected card with a blue ring.
	 */
	export let selectedId: string | null = null;

	const dispatch = createEventDispatcher();

	let summarizers: SummarizerConfig[] = [];
	summarizersStore.subscribe((val) => (summarizers = val));

	/** Creates a new Summarizer in the store */
	function handleAddSummarizer() {
		addSummarizer({
			id: uuidv4(),
			name: 'New Summarizer',
			modelType: 'openai',
			modelId: '',
			knowledgeBaseIds: [],
			instructions: '',
			topK: 4,
			chunkSize: 500,
			chunkOverlap: 50,
			files: [],
			noStream: true
		});
	}

	/** Run all Summarizers and dispatch results for each one */
	async function handleRunAll() {
		const currentSummarizers = get(summarizersStore);

		await Promise.all(
			currentSummarizers.map(async (summ) => {
				summ.noStream = true;
				try {
					const { summaryText, sources } = await generateSummary(token, summ);
					if (onSummaryComplete) {
						onSummaryComplete(summ.id, summaryText, sources);
					}
				} catch (err) {
					console.error('Summarizer error:', summ.id, err);
				}
			})
		);
	}

	/**
	 * Get the knowledge base name for a single ID. If not found, return '(none)'.
	 */
	function getKBName(kbId?: string): string {
		if (!kbId) return '(none)';
		const kb = allKnowledgeBases.find((k) => k.id === kbId);
		return kb ? kb.name : '(none)';
	}

	/** When a card is selected, re-dispatch as "selectSummarizer" */
	function handleCardSelect(e: CustomEvent<string>) {
		dispatch('selectSummarizer', e.detail);
	}

	/** When a card is deleted, remove it from the store */
	function handleCardDelete(e: CustomEvent<string>) {
		const summId = e.detail;
		removeSummarizer(summId);
	}
</script>

<div class="flex flex-col gap-4 text-sm">
	<!-- Buttons row (Add / Run) -->
	<div class="flex gap-2">
		<!-- "Add Agent" Button -->
		<button
			class="
				bg-blue-600 hover:bg-blue-700
				text-white
				px-2 py-1
				rounded
				text-sm font-medium
				flex items-center gap-1
			"
			on:click={handleAddSummarizer}
		>
			<span class="text-lg leading-none">+</span>
			<span>Add Summarizer</span>
		</button>

		<!-- "Run" Button -->
		<button
			class="
				bg-green-600 hover:bg-green-700
				text-white
				px-2 py-1
				rounded
				text-sm font-medium
			"
			on:click={handleRunAll}
		>
			Run All
		</button>
	</div>

	<!-- Summarizer Cards -->
	{#if summarizers.length === 0}
		<div class="text-gray-400 italic">
			No Summarizers yet. Click "Add Summarizer".
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each summarizers as summ (summ.id)}
				<SummarizerCard
					summarizer={summ}
					isSelected={summ.id === selectedId}
					knowledgeBaseName={getKBName(summ.knowledgeBaseIds?.[0])}
					on:select={handleCardSelect}
					on:delete={handleCardDelete}
				/>
			{/each}
		</div>
	{/if}
</div>