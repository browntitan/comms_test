<script lang="ts">
    import { toast } from 'svelte-sonner';
    import fileSaver from 'file-saver';
    const { saveAs } = fileSaver;

    import { goto } from '$app/navigation';
    import { onMount, getContext } from 'svelte';
    import { WEBUI_NAME, config, user } from '$lib/stores';
    import { use_cases, use_case_list } from '$lib/stores/usecases';

    import {
        createNewUseCase,
        deleteUseCaseByCommand,
        getUseCases,
        getUseCaseList
    } from '$lib/apis/usecases';

    import Search from '../icons/Search.svelte';
    import Plus from '../icons/Plus.svelte';
    import EllipsisHorizontal from '../icons/EllipsisHorizontal.svelte';
    import DeleteConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
    import Tooltip from '$lib/components/common/Tooltip.svelte';
    import Spinner from '$lib/components/common/Spinner.svelte';
    import UseCaseMenu from './UseCaseMenu.svelte';
    import { capitalizeFirstLetter } from '$lib/utils';

    const i18n = getContext('i18n');
    let useCasesImportInputElement: HTMLInputElement;
    let loaded = false;

    let importFiles = '';
    let query = '';

    let use_cases_list = [];

    let showDeleteConfirm = false;
    let deleteUseCase = null;

    let filteredItems = [];
    $: filteredItems = use_cases_list?.filter((u) => query === '' || u.command.includes(query)) ?? [];
    
    const shareHandler = async (use_case) => {
        toast.success($i18n.t('Redirecting you to OpenWebUI Community'));

        const url = 'https://openwebui.com';

        const tab = await window.open(`${url}/test/usecases/create`, '_blank');
        window.addEventListener(
            'message',
            (event) => {
                if (event.origin !== url) return;
                if (event.data === 'loaded') {
                    tab.postMessage(JSON.stringify(use_case), '*');
                }
            },
            false
        );
    };

    const cloneHandler = async (use_case) => {
        sessionStorage.use_case = JSON.stringify(use_case);
        goto('/test/usecases/create');
    };

    const exportHandler = async (use_case) => {
        let blob = new Blob([JSON.stringify([use_case])], {
            type: 'application/json'
        });
        saveAs(blob, `use-case-export-${Date.now()}.json`);
    };

    const deleteHandler = async (use_case) => {
        const command = use_case.command;
        await deleteUseCaseByCommand(localStorage.token, command);
        await init();
    };

    const init = async () => {
        use_cases_list = await getUseCaseList(localStorage.token);
        await use_cases.set(await getUseCases(localStorage.token));
        await use_case_list.set(use_cases_list);
        loaded = true;
    };

    onMount(async () => {
        await init();
    });
</script>

<svelte:head>
    <title>
        {$i18n.t('Use Cases')} | {$WEBUI_NAME}
    </title>
</svelte:head>

<!-- Wrap content in a container that matches layout styling and spacing -->
<div class="flex flex-col w-full h-full p-4 overflow-auto dark:text-gray-100 text-gray-700">
    {#if loaded}
        <DeleteConfirmDialog
            bind:show={showDeleteConfirm}
            title={$i18n.t('Delete use case?')}
            on:confirm={() => {
                deleteHandler(deleteUseCase);
            }}
        >
            <div class="text-sm text-gray-500">
                {$i18n.t('This will delete')} <span class="font-semibold">{deleteUseCase?.command}</span>.
            </div>
        </DeleteConfirmDialog>

        <div class="flex flex-col gap-1 my-1.5">
            <div class="flex justify-between items-center">
                <div class="flex md:self-center text-xl font-medium px-0.5 items-center">
                    {$i18n.t('Use Cases')}
                    <div class="flex self-center w-[1px] h-6 mx-2.5 bg-gray-50 dark:bg-gray-850" />
                    <span class="text-lg font-medium text-gray-500 dark:text-gray-300"
                        >{filteredItems.length}</span
                    >
                </div>
            </div>

            <div class="flex w-full space-x-2">
                <div class="flex flex-1 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 items-center">
                    <div class="self-center ml-1 mr-3">
                        <Search className="size-3.5" />
                    </div>
                    <input
                        class="w-full text-sm pr-4 py-1 rounded-r-xl outline-none bg-transparent dark:text-gray-200"
                        bind:value={query}
                        placeholder={$i18n.t('Search Use Cases')}
                    />
                </div>

                <div>
                    <a
                        class="px-2 py-2 rounded-xl hover:bg-gray-700/10 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition font-medium text-sm flex items-center space-x-1"
                        href="/test/usecases/create"
                    >
                        <Plus className="size-3.5" />
                    </a>
                </div>
            </div>
        </div>

        <div class="mb-5 gap-2 grid lg:grid-cols-2 xl:grid-cols-3">
            {#each filteredItems as use_case}
                <div
                    class="flex space-x-4 cursor-pointer w-full px-3 py-2 dark:hover:bg-white/5 hover:bg-black/5 rounded-xl transition"
                >
                    <div class="flex flex-1 space-x-4 cursor-pointer w-full">
                        <a href={`/test/usecases/edit?command=${encodeURIComponent(use_case.command)}`}>
                            <div class="flex-1 flex items-center gap-2 self-center">
                                <div class="font-semibold line-clamp-1 capitalize">{use_case.title}</div>
                                <div class="text-xs overflow-hidden text-ellipsis line-clamp-1">
                                    {use_case.command}
                                </div>
                            </div>

                            <div class="text-xs px-0.5">
                                <Tooltip
                                    content={use_case?.user?.email ?? $i18n.t('Deleted User')}
                                    className="flex shrink-0"
                                    placement="top-start"
                                >
                                    <div class="shrink-0 text-gray-500">
                                        {$i18n.t('By {{name}}', {
                                            name: capitalizeFirstLetter(
                                                use_case?.user?.name ?? use_case?.user?.email ?? $i18n.t('Deleted User')
                                            )
                                        })}
                                    </div>
                                </Tooltip>
                            </div>
                        </a>
                    </div>
                    <div class="flex flex-row gap-0.5 self-center">
                        <a
                            class="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                            type="button"
                            href={`/test/usecases/edit?command=${encodeURIComponent(use_case.command)}`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-4 h-4"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                />
                            </svg>
                        </a>

                        <UseCaseMenu
                            shareHandler={() => {
                                shareHandler(use_case);
                            }}
                            cloneHandler={() => {
                                cloneHandler(use_case);
                            }}
                            exportHandler={() => {
                                exportHandler(use_case);
                            }}
                            deleteHandler={async () => {
                                deleteUseCase = use_case;
                                showDeleteConfirm = true;
                            }}
                            onClose={() => {}}
                        >
                            <button
                                class="self-center w-fit text-sm p-1.5 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                                type="button"
                            >
                                <EllipsisHorizontal className="size-5" />
                            </button>
                        </UseCaseMenu>
                    </div>
                </div>
            {/each}
        </div>

        {#if $user?.role === 'admin'}
            <div class="flex justify-end w-full mb-3">
                <div class="flex space-x-2">
                    <input
                        id="use-cases-import-input"
                        bind:this={useCasesImportInputElement}
                        bind:files={importFiles}
                        type="file"
                        accept=".json"
                        hidden
                        on:change={() => {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                                const savedUseCases = JSON.parse(event.target.result);

                                for (const use_case of savedUseCases) {
                                    await createNewUseCase(localStorage.token, {
                                        command: use_case.command.charAt(0) === '/' ? 
                                            use_case.command.slice(1) : use_case.command,
                                        title: use_case.title,
                                        content: use_case.content,
                                        access_control: use_case.access_control
                                    }).catch((error) => {
                                        toast.error(error);
                                        return null;
                                    });
                                }

                                use_cases_list = await getUseCaseList(localStorage.token);
                                await use_cases.set(await getUseCases(localStorage.token));
                            };

                            reader.readAsText(importFiles[0]);
                        }}
                    />

                    <button
                        class="flex text-xs items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition"
                        on:click={() => {
                            useCasesImportInputElement.click();
                        }}
                    >
                        <div class="self-center mr-2 font-medium line-clamp-1">
                            {$i18n.t('Import Use Cases')}
                        </div>

                        <div class="self-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                class="w-4 h-4"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm4 9.5a.75.75 0 0 1-.75-.75V8.06l-.72.72a.75.75 0 0 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06l-.72-.72v2.69a.75.75 0 0 1-.75.75Z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </button>

                    <button
                        class="flex text-xs items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition"
                        on:click={async () => {
                            let blob = new Blob([JSON.stringify(use_cases_list)], {
                                type: 'application/json'
                            });
                            saveAs(blob, `use-cases-export-${Date.now()}.json`);
                        }}
                    >
                        <div class="self-center mr-2 font-medium line-clamp-1">
                            {$i18n.t('Export Use Cases')}
                        </div>

                        <div class="self-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                class="w-4 h-4"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm4 3.5a.75.75 0 0 1 .75.75v2.69l.72-.72a.75.75 0 1 1 1.06 1.06l-2 2a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06l.72.72V6.25A.75.75 0 0 1 8 5.5Z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        {/if}
    {:else}
        <div class="w-full h-full flex justify-center items-center">
            <Spinner />
        </div>
    {/if}
</div>
