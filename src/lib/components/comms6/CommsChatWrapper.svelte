<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Chat_new from '$lib/components/comms6/Chat_new.svelte';

	import { getPrompts } from '$lib/apis/prompts';
	import { getUseCases } from '$lib/apis/usecases';
	import { getKnowledgeBases } from '$lib/apis/knowledge';
	import { knowledge } from '$lib/stores';
	import { getModels } from '$lib/apis';

	import SummarizersPanel from './SummarizersPanel.svelte';
	import type { SummarizerConfig } from '$lib/stores/summarizers';

	let personas: any[] = [];
	let useCases: any[] = [];
	let knowledgeBases: any[] = [];
	let models: { id: string; name: string; owned_by: string }[] = [];

	let selectedPersona: any = null;
	let selectedUseCase: any = null;

	let files: any[] = [];

	export let chatIdProp: string = '';

	let systemPrompt = '';
	let useCaseGuidance = '';
	export let prompt = '';

	let showKnowledgeSelector = false;
	let chatRef: any; // reference to Chat_new

	const dispatch = createEventDispatcher();

	onMount(async () => {
		const token = localStorage.token;
		personas = await getPrompts(token).catch(() => []);
		useCases = await getUseCases(token).catch(() => []);
		knowledgeBases = await getKnowledgeBases(token).catch(() => []);
		models = await getModels(token).catch(() => []);
		knowledge.set(knowledgeBases);
	});

	// Persona / Use Case handling
	$: systemPrompt = selectedPersona ? selectedPersona.content : '';
	$: useCaseGuidance = selectedUseCase ? selectedUseCase.content : '';

	function onPersonaChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		selectedPersona = val ? personas.find((p) => p.command === val) : null;
	}

	function onUseCaseChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		selectedUseCase = val ? useCases.find((u) => u.command === val) : null;
		prompt = selectedUseCase ? selectedUseCase.content : '';
	}

	function toggleKnowledgeSelector() {
		showKnowledgeSelector = !showKnowledgeSelector;
	}

	function removeKnowledgeBase(kbId: string) {
		files = files.filter((f) => !(f.type === 'collection' && f.collection_name === kbId));
	}

	// Summaries from Summarizer:
	function handleSummaryComplete(summId: string, summaryText: string, sources?: any[]) {
		if (chatRef && typeof chatRef.addSummarizerMessage === 'function') {
			chatRef.addSummarizerMessage(summaryText, sources);
		}
	}
</script>

<!-- Outer wrapper: fills parent space, horizontal layout -->
<div class="flex flex-1 overflow-hidden">
	<!-- Left: Chat area -->
	<div class="flex flex-col flex-1">
		<Chat_new
			bind:this={chatRef}
			{chatIdProp}
			{systemPrompt}
			{useCaseGuidance}
			bind:files
			{prompt}
		/>
	</div>

	<!-- Right: Persona, Use Case, Summarizers, etc. -->
	<div class="w-[320px] border-l border-gray-300 p-4 overflow-y-auto">
		<!-- Persona Section -->
		<h2 class="text-xl font-bold mb-2">Persona</h2>
		<select
			on:change={onPersonaChange}
			class="w-full mb-2 p-1 text-sm text-gray-700 dark:text-gray-100"
		>
			<option value="">None</option>
			{#each personas as persona}
				<option value={persona.command}>{persona.title}</option>
			{/each}
		</select>
		<textarea
			readonly
			class="w-full h-20 mb-4 p-1 text-sm border border-gray-300 text-gray-700 dark:text-gray-100"
		>{selectedPersona ? selectedPersona.content : ''}</textarea>

		<!-- Use Case Section -->
		<h2 class="text-xl font-bold mb-2">Use Case</h2>
		<select
			on:change={onUseCaseChange}
			class="w-full mb-2 p-1 text-sm text-gray-700 dark:text-gray-100"
		>
			<option value="">None</option>
			{#each useCases as uc}
				<option value={uc.command}>{uc.title}</option>
			{/each}
		</select>
		<textarea
			readonly
			class="w-full h-20 mb-4 p-1 text-sm border border-gray-300 text-gray-700 dark:text-gray-100"
		>{selectedUseCase ? selectedUseCase.content : ''}</textarea>

		<!-- Summarizers Panel -->
		<div class="mt-4">
			<SummarizersPanel
				token={localStorage.token}
				allModels={models}
				allKnowledgeBases={knowledgeBases}
				onSummaryComplete={handleSummaryComplete}
			/>
		</div>
	</div>
</div>