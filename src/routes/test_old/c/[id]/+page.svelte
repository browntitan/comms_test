<script lang="ts">
  // We'll get `data.chatId` from the +page.ts above
	import { page } from '$app/stores';
  import Help from '$lib/components/layout/Help.svelte';
  import CommsChatWrapper from '$lib/components/comms8/CommsChatWrapper.svelte';
</script>

<Help />
<CommsChatWrapper chatIdProp={$page.params.id} />
