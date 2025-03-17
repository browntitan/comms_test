<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { use_cases } from '$lib/stores/usecases';
	import { onMount, tick, getContext } from 'svelte';

	const i18n = getContext('i18n');

	import { createNewUseCase, getUseCases } from '$lib/apis/usecases';
    import UseCaseEditor from '$lib/components/usecases/UseCaseEditor.svelte';

	let use_case = null;
	const onSubmit = async (_use_case) => {
		const use_case = await createNewUseCase(localStorage.token, _use_case).catch((error) => {
			toast.error(error);
			return null;
		});

		if (use_case) {
			toast.success($i18n.t('Use case created successfully'));

			await use_cases.set(await getUseCases(localStorage.token));
			await goto('/test/usecases');
		}
	};

	onMount(async () => {
		window.addEventListener('message', async (event) => {
			if (
				![
					'https://openwebui.com',
					'https://www.openwebui.com',
					'http://localhost:5173'
				].includes(event.origin)
			)
				return;
			const _use_case = JSON.parse(event.data);
			console.log(_use_case);

			use_case = {
				title: _use_case.title,
				command: _use_case.command,
				content: _use_case.content,
				access_control: null
			};
		});

		if (window.opener ?? false) {
			window.opener.postMessage('loaded', '*');
		}

		if (sessionStorage.use_case) {
			const _use_case = JSON.parse(sessionStorage.use_case);

			use_case = {
				title: _use_case.title,
				command: _use_case.command,
				content: _use_case.content,
				access_control: null
			};
			sessionStorage.removeItem('use_case');
		}
	});
</script>

{#key use_case}
	<UseCaseEditor {use_case} {onSubmit} />
{/key}
