<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  // Import the chat component that we are wrapping.
  import Chat from '$lib/components/v1_chat/Chat_new.svelte';

  // API functions to fetch data.
  import { getPrompts } from '$lib/apis/prompts';
  import { getUseCases } from '$lib/apis/usecases';
  import { getKnowledgeBases } from '$lib/apis/knowledge';

  // Global store for knowledge bases.
  import { knowledge } from '$lib/stores';

  // ----------------- State Arrays -----------------
  // Personas and use cases come from the backend
  let personas = [];
  let useCases = [];
  // All available knowledge bases (fetched but not necessarily selected)
  let knowledgeBases = [];

  // ----------------- Selected Items -----------------
  let selectedPersona = null;
  let selectedUseCase = null;

  // Files array holds uploaded documents, YouTube transcriptions, etc.
  let files = [];
  // Separate array for selected knowledge base collections.
  let selectedKnowledgeBases = [];

  // ----------------- Exported Props -----------------
  export let chatIdProp = '';

  // Persona (system prompt) and use case guidance (user prompt injection)
  let systemPrompt = '';
  let useCaseGuidance = '';

  // For the Knowledge subcomponent’s search inputs – not used here but declared
  export let prompt = '';
  let command = ''; // Unused, but declared for completeness

  // Show/hide the knowledge selector dropdown.
  let showKnowledgeSelector = false;

  // Create event dispatcher to notify parents or handle analytics.
  const dispatch = createEventDispatcher();

  // ----------------- Lifecycle -----------------
  onMount(async () => {
    const token = localStorage.token;
    // Fetch prompts, use cases, and knowledge bases from the backend.
    personas = await getPrompts(token).catch(() => []);
    useCases = await getUseCases(token).catch(() => []);
    knowledgeBases = await getKnowledgeBases(token).catch(() => []);
    
    // Optionally, store knowledge bases in a global store.
    knowledge.set(knowledgeBases);
  });

  // ----------------- Reactive Statements -----------------
  // Update the system prompt whenever the selected persona changes.
  $: systemPrompt = selectedPersona ? selectedPersona.content : '';
  // Update the use case guidance when the selected use case changes.
  $: useCaseGuidance = selectedUseCase ? selectedUseCase.content : '';

  // ----------------- Event Handlers -----------------

  // Handler for persona dropdown change.
  function onPersonaChange(e) {
    const val = e.target.value;
    selectedPersona = val ? personas.find((p) => p.command === val) : null;
  }

  // Handler for use case dropdown change.
  function onUseCaseChange(e) {
    const val = e.target.value;
    selectedUseCase = val ? useCases.find((u) => u.command === val) : null;
    // If needed, you could also update the prompt with use case content.
    prompt = selectedUseCase ? selectedUseCase.content : '';
  }

  // ----------------- Knowledge Base (Collection) Handling -----------------

  // Toggle display of the knowledge selector dropdown.
  function toggleKnowledgeSelector() {
    showKnowledgeSelector = !showKnowledgeSelector;
  }

  // When a knowledge base is selected from the dropdown.
  function onSelectKnowledge(e) {
    const selectedKB = e.detail;
    // Check if this knowledge base has already been selected.
    if (!selectedKnowledgeBases.some((kb) => kb.id === selectedKB.id)) {
      // Add it to the selected knowledge bases array.
      selectedKnowledgeBases = [
        ...selectedKnowledgeBases,
        { id: selectedKB.id, name: selectedKB.name }
      ];
    }
    // Hide the knowledge selector.
    showKnowledgeSelector = false;
    // Dispatch a select event for any parent handling.
    dispatch('select', selectedKB);
  }

  // Remove a knowledge base from the selected list.
  function removeKnowledgeBase(kbId) {
    selectedKnowledgeBases = selectedKnowledgeBases.filter((kb) => kb.id !== kbId);
  }
</script>

<div class="layout-wrapper">
  <!-- Left: Main Chat area -->
  <div class="chat-area">
    <Chat
      {systemPrompt}
      {useCaseGuidance}
      {chatIdProp}
      bind:files
      knowledgeBaseIds={selectedKnowledgeBases.map((kb) => kb.id)}
      knowledgeBaseNames={selectedKnowledgeBases.map((kb) => kb.name)}
      {prompt}
    />
  </div>

  <!-- Right: Selector Panel for Persona, Use Case, and Knowledge Bases -->
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
      <textarea class="textarea" readonly>{selectedPersona ? selectedPersona.content : ''}</textarea>
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
      <textarea class="textarea" readonly>{selectedUseCase ? selectedUseCase.content : ''}</textarea>
    </div>

    <!-- Knowledge Base Selector -->
    <div class="selector-group knowledge-group">
      <h3>Knowledge Bases</h3>
      <!-- Display selected knowledge bases as chips -->
      <div class="selected-knowledge-bases">
        {#each selectedKnowledgeBases as kb}
          <div class="knowledge-chip">
            {kb.name}
            <button class="remove-chip" on:click={() => removeKnowledgeBase(kb.id)}>
              ×
            </button>
          </div>
        {/each}
      </div>

      <!-- Button to toggle the knowledge base dropdown -->
      <div class="knowledge-controls">
        <button class="selector" on:click={toggleKnowledgeSelector}>
          {showKnowledgeSelector ? 'Cancel' : 'Add Knowledge Base'}
        </button>
      </div>

      <!-- Knowledge base dropdown component (assumed to be provided by your Knowledge component) -->
      {#if showKnowledgeSelector}
        <div class="knowledge-dropdown-wrapper">
          <!-- The Knowledge component is expected to dispatch a 'select' event when a KB is chosen -->
          <Knowledge
            bind:prompt
            bind:command
            on:select={onSelectKnowledge}
            on:url={e => {/* handle URL if needed */}}
            on:youtube={e => {/* handle YouTube links if needed */}}
          />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
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
  .knowledge-controls {
    margin-bottom: 1rem;
  }
  .knowledge-dropdown-wrapper {
    position: absolute;
    top: 3rem;
    left: 0;
    width: 100%;
    z-index: 999;
    background-color: var(--background-dark);
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
  }
</style>