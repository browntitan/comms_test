<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SummarizerConfig } from '$lib/stores/summarizers';

	export let summarizer: SummarizerConfig;
	/** Indicates whether this card is currently selected */
	export let isSelected = false;

	/**
	 * New prop for displaying the KB name
	 * (instead of referencing summarizer.knowledgeBaseIds directly).
	 */
	export let knowledgeBaseName: string = '(none)';

	const dispatch = createEventDispatcher();

	function handleSelect() {
		// “select” event with Summarizer’s ID
		dispatch('select', summarizer.id);
	}

	function handleDelete(e: MouseEvent) {
		// Stop the click from also triggering "select"
		e.stopPropagation();
		// “delete” event with Summarizer’s ID
		dispatch('delete', summarizer.id);
	}
</script>

<div
	class="
		border border-gray-600
		rounded p-2
		cursor-pointer
		hover:bg-gray-700
		transition-colors
		relative
	"
	class:ring-2={isSelected}
	class:ring-blue-500={isSelected}
	on:click={handleSelect}
>
	<!-- Summarizer Name -->
	<div class="font-semibold text-sm">
		{summarizer.name}
	</div>

	<!-- Show the knowledge base name (instead of ID) -->
	<div class="text-xs text-gray-400">
		KB: {knowledgeBaseName}
	</div>

	<!-- Inline remove button -->
	<button
		on:click={handleDelete}
		class="text-red-400 text-xs mt-1 hover:underline"
	>
		Remove
	</button>
</div>