<script lang="ts">
	import { page } from '$app/stores';

	import CommsChatWrapper from '$lib/components/chat/CommsChatWrapper.svelte';
	import Help from '$lib/components/layout/Help.svelte';
</script>

<Help />
<CommsChatWrapper chatIdProp={$page.params.id} />
