<script lang="ts">
	import { page } from '$app/stores';
  import Help from '$lib/components/layout/Help.svelte';
  import CommsChatWrapper from '$lib/components/v2_chat/CommsChatWrapper.svelte';
</script>

<Help />
<CommsChatWrapper chatIdProp={$page.params.id} />
