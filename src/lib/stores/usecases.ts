import { writable, type Writable } from 'svelte/store';
import type { UseCase, UseCaseUserResponse } from '$lib/types/use_cases';

// Core use cases store
export const use_cases: Writable<null | UseCase[]> = writable(null);

// Store for user responses including user details
export const use_case_list: Writable<null | UseCaseUserResponse[]> = writable(null);

// Store for currently selected use case
export const current_use_case: Writable<null | UseCase> = writable(null);

// Export store actions
export const use_cases_actions = {
    reset: () => {
        use_cases.set(null);
        use_case_list.set(null);
        current_use_case.set(null);
    },
    setUseCases: (newUseCases: UseCase[]) => {
        use_cases.set(newUseCases);
    },
    setUseCaseList: (newUseCaseList: UseCaseUserResponse[]) => {
        use_case_list.set(newUseCaseList);
    },
    setCurrentUseCase: (useCase: UseCase) => {
        current_use_case.set(useCase);
    }
};