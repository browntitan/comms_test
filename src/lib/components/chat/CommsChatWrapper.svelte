<script lang="ts">
  import { page } from '$app/stores';

  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  // Updated Chat component where we rely on `params?.system` to apply the system prompt
  import Chat from '$lib/components/chat/Chat.svelte';

  // API functions
  import { getPrompts } from '$lib/apis/prompts';
  import { getUseCases } from '$lib/apis/usecases';
  import { getKnowledgeBases } from '$lib/apis/knowledge';

  // Store (if used globally for knowledge)
  import { knowledge } from '$lib/stores';

  // ------------------------------
  // State Arrays
  let personas = [];
  let useCases = [];
  let knowledgeBases = [];

  // ------------------------------
  // Selected items
  let selectedPersona = null;
  let selectedUseCase = null;
  let selectedKnowledgeBase = null;

  // The 'files' array is used for both normal file uploads and knowledge-base “collections”
  let files = [];

  // ------------------------------
  // Props to pass into <Chat>
  export let chatIdProp = '';

  // We will hold the persona’s text in systemPrompt, but ultimately store it in params.system
  let systemPrompt = '';
  let useCaseGuidance = '';

  // The child chat also binds to `prompt`
  export let prompt = '';

  // We'll create a `params` object and simply store systemPrompt in `params.system`.
  let params = {};

  // Create an event dispatcher if needed
  const dispatch = createEventDispatcher();

  // ------------------------------
  // Lifecycle: fetch backend data
  onMount(async () => {
    const token = localStorage.token;
    personas = await getPrompts(token).catch(() => []);
    useCases = await getUseCases(token).catch(() => []);
    knowledgeBases = await getKnowledgeBases(token).catch(() => []);
    knowledge.set(knowledgeBases);
  });

  // ------------------------------
  // Reactive statements
  // Keep systemPrompt in sync with the selected persona
  $: systemPrompt = selectedPersona ? selectedPersona.content : '';
  // Also set useCaseGuidance from selected use case
  $: useCaseGuidance = selectedUseCase ? selectedUseCase.content : '';

  // This line ensures Chat_new sees systemPrompt as params.system
  $: params.system = systemPrompt;

  // ------------------------------
  // Event handlers
  function onPersonaChange(e) {
    const val = e.target.value;
    selectedPersona = val ? personas.find((p) => p.command === val) : null;
  }

  function onUseCaseChange(e) {
    const val = e.target.value;
    selectedUseCase = val ? useCases.find((u) => u.command === val) : null;
    prompt = selectedUseCase ? selectedUseCase.content : '';
  }

  // Knowledge base dropdown
  function onKnowledgeBaseChange(e) {
    const kbId = e.target.value;
    if (!kbId) {
      selectedKnowledgeBase = null;
      return;
    }
    selectedKnowledgeBase = knowledgeBases.find((kb) => kb.id === kbId);

    // If not already in `files`, add it
    if (!files.some((f) => f.type === 'collection' && f.id === selectedKnowledgeBase.id)) {
      files = [
        ...files,
        {
          ...selectedKnowledgeBase,
          type: 'collection',
          status: 'processed'
        }
      ];
    }
  }

  function removeKnowledgeBase(kbId) {
    files = files.filter((file) => !(file.type === 'collection' && file.id === kbId));
  }
</script>

<!-- Layout: Left = Main Chat, Right = Persona/UseCase/KnowledgeBase selections -->
<div class="layout-wrapper">
  <!-- Left: Chat Area -->
  <div class="chat-area">
    <!-- 
      We now pass `params` instead of a separate `systemPrompt` prop.
      The Chat component’s logic reads `params.system`.
    -->
    <Chat
      {chatIdProp}
      bind:files
      bind:prompt
      {params}
      {useCaseGuidance}
      {systemPrompt}
    />
  </div>

  <!-- Right: Selection Panel -->
  <div class="selector-panel">
    <!-- Persona Selector -->
    <div class="selector-group persona-group">
      <h3>Persona</h3>
      <select class="selector" on:change={onPersonaChange}>
        <option value="">None</option>
        {#each personas as persona}
          <option value={persona.command}>{persona.title}</option>
        {/each}
      </select>
      <textarea class="textarea" readonly>
        {selectedPersona ? selectedPersona.content : ''}
      </textarea>
    </div>

    <!-- Use Case Selector -->
    <div class="selector-group use-case-group">
      <h3>Use Case</h3>
      <select class="selector" on:change={onUseCaseChange}>
        <option value="">None</option>
        {#each useCases as uc}
          <option value={uc.command}>{uc.title}</option>
        {/each}
      </select>
      <textarea class="textarea" readonly>
        {selectedUseCase ? selectedUseCase.content : ''}
      </textarea>
    </div>

    <!-- Knowledge Base Selection -->
    <div class="selector-group knowledge-group">
      <h3>Knowledge Base</h3>
      <select class="selector" on:change={onKnowledgeBaseChange}>
        <option value="">None</option>
        {#each knowledgeBases as kb}
          <option value={kb.id}>{kb.name}</option>
        {/each}
      </select>

      <textarea class="textarea" readonly>
        {selectedKnowledgeBase ? selectedKnowledgeBase.description : ''}
      </textarea>

      <div class="selected-knowledge-bases">
        {#each files.filter((f) => f.type === 'collection') as kbFile}
          <div class="knowledge-chip">
            {kbFile.name}
            <button class="remove-chip" on:click={() => removeKnowledgeBase(kbFile.id)}>
              ×
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* Same styling as before */
  .layout-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--background-dark);
    margin: 0;
    padding: 0;
    overflow-y: auto;
  }
  .selector-panel {
    width: 300px;
    border-left: 1px solid var(--border-color);
    margin-top: 0;
    padding: 1.5rem;
  }
  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  .persona-group,
  .use-case-group {
    margin-bottom: 2.5rem;
  }
  .knowledge-group {
    flex-grow: 1;
    position: relative;
  }
  .selector {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background-color: var(--input-background);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
  }
  .textarea {
    width: 100%;
    height: 4rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background-color: var(--input-background);
    color: var(--text-color);
    resize: none;
  }
  .selected-knowledge-bases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .knowledge-chip {
    display: flex;
    align-items: center;
    background-color: var(--input-background);
    color: var(--text-color);
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    font-size: 0.85rem;
  }
  .remove-chip {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 1rem;
    margin-left: 0.5rem;
    cursor: pointer;
  }
</style>