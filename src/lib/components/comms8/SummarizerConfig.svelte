<!-- FILE: src/lib/components/comms8/SummarizerConfig.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { uploadFile } from '$lib/apis/files';
	import type { SummarizerConfig } from '$lib/stores/summarizers';

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

	// Model selection
	function handleModelChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		const selectedModel = allModels.find((m) => m.id === val);
		let newType: 'openai' | 'ollama' = 'openai';
		if (selectedModel?.owned_by === 'ollama') {
			newType = 'ollama';
		}
		dispatch('update', {
			id: summarizer.id,
			modelId: val,
			modelType: newType
		});
	}

	// Knowledge Base selection
	function handleKBChange(e: Event) {
		const kbId = (e.target as HTMLSelectElement).value;
		dispatch('update', {
			id: summarizer.id,
			knowledgeBaseIds: [kbId]
		});
	}

	// Summarizer instructions
	function handleInstructions(e: Event) {
		const instructions = (e.target as HTMLTextAreaElement).value;
		dispatch('update', {
			id: summarizer.id,
			instructions
		});
	}

	// Summarizer name
	function handleName(e: Event) {
		const nameVal = (e.target as HTMLInputElement).value;
		dispatch('update', {
			id: summarizer.id,
			name: nameVal
		});
	}

	// Deletion
	function handleDelete() {
		dispatch('delete', summarizer.id);
	}

	// RAG chunking fields
	function handleTopK(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', {
			id: summarizer.id,
			topK: isNaN(val) ? undefined : val
		});
	}
	function handleChunkSize(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', {
			id: summarizer.id,
			chunkSize: isNaN(val) ? undefined : val
		});
	}
	function handleChunkOverlap(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		dispatch('update', {
			id: summarizer.id,
			chunkOverlap: isNaN(val) ? undefined : val
		});
	}

	// File upload
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
		fileInputEl.value = ''; // reset the file input

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

<!-- Summarizer Configuration Form -->
<div
	class="
		p-1
		rounded
		shadow-sm
		bg-gray-800
		text-gray-100
		border border-gray-700
		space-y-2
	"
>
	<!-- Name -->
	<div>
		<label class="block text-sm font-medium mb-1">Name</label>
		<input
			class="
				w-full
				px-3
				py-2
				bg-gray-700
				border border-gray-600
				rounded
				text-sm
				focus:outline-none
				focus:border-blue-500
			"
			type="text"
			bind:value={summarizer.name}
			on:change={handleName}
			placeholder="Summarizer Name"
		/>
	</div>

	<!-- Model -->
	<div>
		<label class="block text-sm font-medium mb-1">Model</label>
		<select
			class="
				w-full
				px-3
				py-2
				bg-gray-700
				border border-gray-600
				rounded
				text-sm
				focus:outline-none
				focus:border-blue-500
			"
			on:change={handleModelChange}
			bind:value={summarizer.modelId}
		>
			<option value="" disabled>Select Model</option>
			{#each allModels as m}
				<option value={m.id}>{m.name} ({m.owned_by})</option>
			{/each}
		</select>
	</div>

	<!-- Knowledge Base -->
	<div>
		<label class="block text-sm font-medium mb-1">Knowledge Base</label>
		<select
			class="
				w-full
				px-3
				py-2
				bg-gray-700
				border border-gray-600
				rounded
				text-sm
				focus:outline-none
				focus:border-blue-500
			"
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

	<!-- Instructions -->
	<div>
		<label class="block text-sm font-medium mb-1">Instructions</label>
		<textarea
			class="
				w-full
				h-24
				p-2
				bg-gray-700
				border border-gray-600
				rounded
				text-sm
				focus:outline-none
				focus:border-blue-500
			"
			bind:value={summarizer.instructions}
			on:change={handleInstructions}
			placeholder="Add any instructions or custom prompts here..."
		/>
	</div>

	<!-- RAG chunking: Top K, Chunk Size, Overlap -->
	<div class="grid grid-cols-3 gap-2">
		<!-- Top K -->
		<div>
			<label class="block text-sm font-medium mb-1">Top K</label>
			<input
				type="number"
				min="1"
				class="
					w-full
					px-2
					py-1
					bg-gray-700
					border border-gray-600
					rounded
					text-sm
					focus:outline-none
					focus:border-blue-500
				"
				value={summarizer.topK}
				on:change={handleTopK}
			/>
		</div>
		<!-- Chunk Size -->
		<div>
			<label class="block text-sm font-medium mb-1">Chunk Size</label>
			<input
				type="number"
				min="100"
				class="
					w-full
					px-2
					py-1
					bg-gray-700
					border border-gray-600
					rounded
					text-sm
					focus:outline-none
					focus:border-blue-500
				"
				value={summarizer.chunkSize}
				on:change={handleChunkSize}
			/>
		</div>
		<!-- Overlap -->
		<div>
			<label class="block text-sm font-medium mb-1">Overlap</label>
			<input
				type="number"
				min="0"
				class="
					w-full
					px-2
					py-1
					bg-gray-700
					border border-gray-600
					rounded
					text-sm
					focus:outline-none
					focus:border-blue-500
				"
				value={summarizer.chunkOverlap}
				on:change={handleChunkOverlap}
			/>
		</div>
	</div>

	<!-- File Upload -->
	<div>
		<div class="flex items-center justify-between">
			<label class="block text-sm font-medium">Uploaded Docs</label>
			<button
				class="
					text-blue-400
					text-sm
					font-medium
					hover:underline
					focus:outline-none
				"
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
			<ul class="pl-4 text-sm list-disc space-y-1 mt-1">
				{#each summarizer.files as f}
					<li>{f.name ? f.name : f.id}</li>
				{/each}
			</ul>
		{:else}
			<div class="text-sm text-gray-400 italic mt-1">No uploaded docs</div>
		{/if}
	</div>

	<!-- Delete Summarizer -->
	<div class="flex justify-end pt-2">
		<button
			class="
				text-red-400
				text-sm
				font-medium
				hover:underline
				focus:outline-none
			"
			on:click={handleDelete}
		>
			Remove
		</button>
	</div>
</div>