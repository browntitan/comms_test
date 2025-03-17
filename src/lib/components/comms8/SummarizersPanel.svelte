<!-- FILE: src/lib/components/comms8/SummarizersPanel.svelte -->
<script lang="ts">
	import { summarizersStore, updateSummarizer, removeSummarizer } from '$lib/stores/summarizers';
	import SummarizerList from './SummarizerList.svelte';
	import SummarizerConfig from './SummarizerConfig.svelte';

	// Types
	import type { SummarizerConfig as SummCfg } from '$lib/stores/summarizers';

	/**
	 * Props:
	 *  - token: string
	 *  - allModels: array of { id: string; name: string; owned_by: string }
	 *  - allKnowledgeBases: array of { id?: string; collection_name: string; name: string }
	 *  - onSummaryComplete: callback (summId, summaryText, sources) => void
	 */
	export let token: string;
	export let allModels: { id: string; name: string; owned_by: string }[] = [];
	export let allKnowledgeBases: { id?: string; collection_name: string; name: string }[] = [];
	export let onSummaryComplete: (id: string, text: string, sources?: any[]) => void;

	// Track which Summarizer is currently selected for configuration
	export let selectedSummarizerId: string | null = null;

	/**
	 * Make SummarizersPanel truly reactive to changes in summarizersStore
	 */
	$: summarizers = $summarizersStore;
	$: selectedSummarizer = summarizers.find((s) => s.id === selectedSummarizerId);

	/** SummarizerList -> "selectSummarizer" */
	function handleSelectSummarizer(e: CustomEvent<string>) {
		selectedSummarizerId = e.detail;
	}

	/** SummarizerConfig -> "update" */
	function handleUpdateSummarizer(e: CustomEvent<{ id: string } & Partial<SummCfg>>) {
		const { id, ...changes } = e.detail;
		updateSummarizer(id, changes);
	}

	/** SummarizerConfig -> "delete" */
	function handleDeleteSummarizer(e: CustomEvent<string>) {
		const summId = e.detail;
		removeSummarizer(summId);

		if (summId === selectedSummarizerId) {
			selectedSummarizerId = null;
		}
	}
</script>

<!-- 
  Updated styling: darker background, lighter text, 
  consistent with SummarizerConfig’s new look.
-->
<div class="bg-gray-800 text-gray-100 h-full w-full flex flex-col">
	<!-- TOP HALF: SummarizerList -->
	<div class="flex-1 overflow-y-auto p-4">
		<SummarizerList
			{token}
			allModels={allModels}
			allKnowledgeBases={allKnowledgeBases}
			onSummaryComplete={onSummaryComplete}
			on:selectSummarizer={handleSelectSummarizer}
		/>
	</div>

	<!-- Faint dividing line -->
	<div class="border-b border-gray-700 my-2"></div>

	<!-- BOTTOM HALF: SummarizerConfig of selected Summarizer -->
	<div class="flex-1 overflow-y-auto p-2">
		{#if selectedSummarizer}
			<SummarizerConfig
				token={token}
				summarizer={selectedSummarizer}
				allModels={allModels}
				allKnowledgeBases={allKnowledgeBases}
				on:update={handleUpdateSummarizer}
				on:delete={handleDeleteSummarizer}
			/>
		{:else}
			<p class="text-sm text-gray-400 italic p-2">
				Select a Summarizer card above to configure it.
			</p>
		{/if}
	</div>
</div>