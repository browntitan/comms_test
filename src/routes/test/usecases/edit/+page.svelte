<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { use_cases } from '$lib/stores/usecases';
	import { onMount, tick, getContext } from 'svelte';

	const i18n = getContext('i18n');

	import { getUseCaseByCommand, getUseCases, updateUseCaseByCommand } from '$lib/apis/usecases';
	import { page } from '$app/stores';

	import UseCaseEditor from '$lib/components/usecases/UseCaseEditor.svelte';

	let use_case = null;
	const onSubmit = async (_use_case) => {
		console.log(_use_case);
		const use_case = await updateUseCaseByCommand(localStorage.token, _use_case).catch((error) => {
			toast.error(error);
			return null;
		});

		if (use_case) {
			toast.success($i18n.t('Use case updated successfully'));
			await use_cases.set(await getUseCases(localStorage.token));
			await goto('/test/usecases');
		}
	};

	onMount(async () => {
		const command = $page.url.searchParams.get('command');
		if (command) {
			const _use_case = await getUseCaseByCommand(
				localStorage.token,
				command.replace(/\//g, '')
			).catch((error) => {
				toast.error(error);
				return null;
			});

			if (_use_case) {
				use_case = {
					title: _use_case.title,
					command: _use_case.command,
					content: _use_case.content,
					access_control: _use_case?.access_control ?? null
				};
			} else {
				goto('/test/usecases');
			}
		} else {
			goto('/test/usecases');
		}
	});
</script>

{#if use_case}
	<UseCaseEditor {use_case} {onSubmit} edit />
{/if}
