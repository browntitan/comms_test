<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';

	import type { SummarizerConfig } from '$lib/stores/summarizers';
	import { uploadFile } from '$lib/apis/files';

	/**
	 * Props:
	 *  - token: user token for API calls
	 *  - summarizer: SummarizerConfig
	 *  - allModels: { id: string; name: string; owned_by: string }[]
	 *  - allKnowledgeBases: { id?: string; collection_name: string; name: string }[]
	 */
	export let token: string;
	export let summarizer: SummarizerConfig;
	export let allModels: { id: string; name: string; owned_by: string }[] = [];
	export let allKnowledgeBases: { id?: string; collection_name: string; name: string }[] = [];

	const dispatch = createEventDispatcher();

	function handleModelChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const selectedModel = allModels.find((m) => m.id === val);
		let newType: 'openai' | 'ollama' = 'openai';
		if (selectedModel?.owned_by === 'ollama') {
			newType = 'ollama';
		}
		dispatch('update', { id: summarizer.id, modelId: val, modelType: newType });
	}

	function handleKBChange(e: Event) {
		const kbId = (e.target as HTMLSelectElement).value;
		dispatch('update', { id: summarizer.id, knowledgeBaseIds: [kbId] });
	}

	function handleInstructions(e: Event) {
		const instructions = (e.target as HTMLTextAreaElement).value;
		dispatch('update', { id: summarizer.id, instructions });
	}

	function handleName(e: Event) {
		const nameVal = (e.target as HTMLInputElement).value;
		dispatch('update', { id: summarizer.id, name: nameVal });
	}

	function handleDelete() {
		dispatch('delete', summarizer.id);
	}

	function handleTopK(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', { id: summarizer.id, topK: isNaN(val) ? undefined : val });
	}
	function handleChunkSize(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', { id: summarizer.id, chunkSize: isNaN(val) ? undefined : val });
	}
	function handleChunkOverlap(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', { id: summarizer.id, chunkOverlap: isNaN(val) ? undefined : val });
	}

	let fileInputEl: HTMLInputElement | undefined;

	function openFileDialog() {
		fileInputEl?.click();
	}

	async function handleFilePicked(e: Event) {
		const inputEl = e.target as HTMLInputElement;
		if (!inputEl.files || inputEl.files.length === 0) {
			return;
		}
		const file = inputEl.files[0];
		fileInputEl.value = ''; // reset

		if (!file || file.size === 0) {
			toast.error('Cannot upload empty file');
			return;
		}

		try {
			const uploadedFile = await uploadFile(token, file);
			if (!uploadedFile || !uploadedFile.id) {
				toast.error('File upload failed');
				return;
			}

			toast.success(`File "${file.name}" uploaded successfully`);

			if (!summarizer.files) {
				summarizer.files = [];
			}
			summarizer.files.push({
				type: 'file',
				id: uploadedFile.id,
				name: file.name,
				status: 'uploaded'
			});

			dispatch('update', { id: summarizer.id, files: summarizer.files });
		} catch (err) {
			console.error(err);
			toast.error(`Error uploading file: ${err}`);
		}
	}
</script>

<div class="summarizer-item mb-3 rounded border border-gray-300 p-3 bg-white shadow-sm">
	<!-- Summarizer Name -->
	<div class="mb-2">
		<label class="block text-sm font-semibold mb-1">Name</label>
		<input
			class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
			type="text"
			bind:value={summarizer.name}
			on:change={handleName}
		/>
	</div>

	<!-- Model dropdown -->
	<div class="mb-2">
		<label class="block text-sm font-semibold mb-1">Model</label>
		<select
			class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
			on:change={handleModelChange}
			bind:value={summarizer.modelId}
		>
			<option value="" disabled>Select Model</option>
			{#each allModels as m}
				<option value={m.id}>{m.name} ({m.owned_by})</option>
			{/each}
		</select>
	</div>

	<!-- Knowledge Base selection -->
	<div class="mb-2">
		<label class="block text-sm font-semibold mb-1">Knowledge Base</label>
		<select
			class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
			on:change={handleKBChange}
		>
			<option value="" disabled selected>Select KB</option>
			{#each allKnowledgeBases as kb}
				<option
					value={kb.id || kb.collection_name}
					selected={summarizer.knowledgeBaseIds?.[0] === (kb.id || kb.collection_name)}
				>
					{kb.name}
				</option>
			{/each}
		</select>
	</div>

	<!-- Summarizer instructions -->
	<div class="mb-2">
		<label class="block text-sm font-semibold mb-1">Instructions</label>
		<textarea
			class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
			rows="3"
			bind:value={summarizer.instructions}
			on:change={handleInstructions}
		/>
	</div>

	<!-- RAG chunking / topK -->
	<div class="grid grid-cols-3 gap-2 mb-2">
		<div>
			<label class="block text-sm font-semibold mb-1">Top K</label>
			<input
				type="number"
				min="1"
				class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
				value={summarizer.topK}
				on:change={handleTopK}
			/>
		</div>
		<div>
			<label class="block text-sm font-semibold mb-1">Chunk Size</label>
			<input
				type="number"
				min="100"
				class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
				value={summarizer.chunkSize}
				on:change={handleChunkSize}
			/>
		</div>
		<div>
			<label class="block text-sm font-semibold mb-1">Overlap</label>
			<input
				type="number"
				min="0"
				class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
				value={summarizer.chunkOverlap}
				on:change={handleChunkOverlap}
			/>
		</div>
	</div>

	<!-- File Upload => stored only in summarizer.files if you like (for local usage) -->
	<div class="mb-2">
		<div class="flex items-center justify-between">
			<label class="block text-sm font-semibold mb-1">Uploaded Docs</label>
			<button
				class="text-blue-600 text-sm hover:text-blue-800 font-semibold"
				type="button"
				on:click={openFileDialog}
			>
				Add Doc
			</button>
		</div>
		<input
			type="file"
			class="hidden"
			bind:this={fileInputEl}
			on:change={handleFilePicked}
		/>

		{#if summarizer.files && summarizer.files.length > 0}
			<ul class="pl-4 text-sm text-gray-700 list-disc">
				{#each summarizer.files as f, i}
					<li>{f.name ? f.name : f.id}</li>
				{/each}
			</ul>
		{:else}
			<div class="text-sm text-gray-500 italic">No uploaded docs for RAG</div>
		{/if}
	</div>

	<div class="flex justify-end mt-2">
		<button
			class="text-red-600 text-sm hover:text-red-800 font-semibold"
			on:click={handleDelete}
		>
			Remove
		</button>
	</div>
</div>