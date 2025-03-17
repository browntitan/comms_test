import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { UseCase, UseCaseForm, UseCaseUserResponse } from '$lib/types/usecases';

export const createNewUseCase = async (token: string, use_case: UseCaseForm) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/create`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            ...use_case,
            command: `/${use_case.command}`
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getUseCases = async (token: string = '') => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        }
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getUseCaseList = async (token: string = '') => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/list`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        }
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const getUseCaseByCommand = async (token: string, command: string) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/command/${command}`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        }
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const updateUseCaseByCommand = async (token: string, use_case: UseCaseForm) => {
    let error = null;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/command/${use_case.command}/update`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            ...use_case,
            command: `/${use_case.command}`
        })
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const deleteUseCaseByCommand = async (token: string, command: string) => {
    let error = null;

    command = command.charAt(0) === '/' ? command.slice(1) : command;

    const res = await fetch(`${WEBUI_API_BASE_URL}/test/usecases/command/${command}/delete`, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`
        }
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            error = err.detail;
            console.log(err);
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};