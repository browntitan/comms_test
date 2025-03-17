import type { UserResponse, AccessControl } from '$lib/types';

export type UseCase = {
    command: string;
    user_id: string;
    title: string;
    content: string;
    timestamp: number;
    access_control: AccessControl | null;
};

export type UseCaseUserResponse = UseCase & {
    user: UserResponse | null;
};

export type UseCaseForm = {
    command: string;
    title: string;
    content: string;
    access_control?: AccessControl;
};

// Response types for API operations
export type UseCaseListResponse = {
    use_cases: UseCaseUserResponse[];
    total: number;
    page: number;
};

export type UseCaseResponse = {
    success: boolean;
    use_case?: UseCase;
    error?: string;
};

export type UseCaseDeleteResponse = {
    success: boolean;
    error?: string;
};

// Type guard
export function isUseCase(obj: any): obj is UseCase {
    return (
        obj &&
        typeof obj.command === 'string' &&
        typeof obj.user_id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        typeof obj.timestamp === 'number'
    );
}