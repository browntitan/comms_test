<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import SummarizerItem from '$lib/components/comms6/SummarizerItem.svelte';
	import {
		summarizersStore,
		addSummarizer,
		removeSummarizer,
		updateSummarizer
	} from '$lib/stores/summarizers';
	import type { SummarizerConfig } from '$lib/stores/summarizers';
	import { generateSummary } from '$lib/apis/summarizers'; // Our local Summarizer code
	import { get } from 'svelte/store';

	export let token: string;
	export let allModels: { id: string; name: string; owned_by: string }[] = [];
	export let allKnowledgeBases: { id?: string; collection_name: string; name: string }[] = [];

	/**
	 * onSummaryComplete is called after each Summarizer finishes.
	 * Typically, the parent calls `chatRef.addSummarizerMessage(...)`.
	 */
	export let onSummaryComplete: (summId: string, summaryText: string, sources?: any[]) => void;

	let summarizers: SummarizerConfig[] = [];
	summarizersStore.subscribe((val) => (summarizers = val));

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
			noStream: true // default to non-streaming
		});
	}

	function handleDelete(event: CustomEvent<string>) {
		const summarizerId = event.detail;
		removeSummarizer(summarizerId);
	}

	function handleUpdate(event: CustomEvent<{ id: string } & Partial<SummarizerConfig>>) {
		const changes = event.detail;
		updateSummarizer(changes.id, changes);
	}

	/**
	 * Called when user clicks "Run All Summaries".
	 */
	async function handleRunAll() {
		const currentSummarizers = get(summarizersStore);

		await Promise.all(
			currentSummarizers.map(async (summ) => {
				// Force noStream
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
</script>

<div class="summarizers-panel bg-gray-100 text-gray-800 p-4 rounded shadow-sm">
	<h4 class="font-bold text-lg mb-3">Knowledge Summarizers</h4>

	{#each summarizers as s (s.id)}
		<SummarizerItem
			summarizer={s}
			allModels={allModels}
			allKnowledgeBases={allKnowledgeBases}
			token={token}
			on:delete={handleDelete}
			on:update={handleUpdate}
		/>
	{/each}

	<div class="flex flex-col gap-2 mt-4">
		<button
			class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium"
			on:click={handleAddSummarizer}
		>
			Add Knowledge Summarizer
		</button>

		{#if summarizers.length > 0}
			<button
				class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium"
				on:click={handleRunAll}
			>
				Run All Summaries
			</button>
		{/if}
	</div>
</div>