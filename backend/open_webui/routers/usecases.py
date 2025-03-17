from typing import Optional

from open_webui.models.usecases import (
    UseCaseForm,
    UseCaseUserResponse,
    UseCaseModel,
    UseCases,
)
from open_webui.constants import ERROR_MESSAGES
from fastapi import APIRouter, Depends, HTTPException, status, Request
from open_webui.utils.auth import get_verified_user
from open_webui.utils.access_control import has_access, has_permission

router = APIRouter()

############################
# GetUseCases
############################


@router.get("/", response_model=list[UseCaseModel])
async def get_use_cases(user=Depends(get_verified_user)):
    if user.role == "admin":
        use_cases = UseCases.get_use_cases()
    else:
        use_cases = UseCases.get_use_cases_by_user_id(user.id, "read")

    return use_cases


@router.get("/list", response_model=list[UseCaseUserResponse])
async def get_use_case_list(user=Depends(get_verified_user)):
    if user.role == "admin":
        use_cases = UseCases.get_use_cases()
    else:
        use_cases = UseCases.get_use_cases_by_user_id(user.id, "write")

    return use_cases


############################
# CreateNewUseCase
############################


@router.post("/create", response_model=Optional[UseCaseModel])
async def create_new_use_case(
    request: Request, form_data: UseCaseForm, user=Depends(get_verified_user)
):
    if user.role != "admin" and not has_permission(
        user.id, "workspace.use_cases", request.app.state.config.USER_PERMISSIONS
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.UNAUTHORIZED,
        )

    use_case = UseCases.get_use_case_by_command(form_data.command)
    if use_case is None:
        use_case = UseCases.insert_new_use_case(user.id, form_data)

        if use_case:
            return use_case
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES.DEFAULT(),
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=ERROR_MESSAGES.COMMAND_TAKEN,
    )


############################
# GetUseCaseByCommand
############################


@router.get("/command/{command}", response_model=Optional[UseCaseModel])
async def get_use_case_by_command(command: str, user=Depends(get_verified_user)):
    use_case = UseCases.get_use_case_by_command(f"/{command}")

    if use_case:
        if (
            user.role == "admin"
            or use_case.user_id == user.id
            or has_access(user.id, "read", use_case.access_control)
        ):
            return use_case
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.NOT_FOUND,
        )


############################
# UpdateUseCaseByCommand
############################


@router.post("/command/{command}/update", response_model=Optional[UseCaseModel])
async def update_use_case_by_command(
    command: str,
    form_data: UseCaseForm,
    user=Depends(get_verified_user),
):
    use_case = UseCases.get_use_case_by_command(f"/{command}")
    if not use_case:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.NOT_FOUND,
        )

    if use_case.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.ACCESS_PROHIBITED,
        )

    use_case = UseCases.update_use_case_by_command(f"/{command}", form_data)
    if use_case:
        return use_case
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.ACCESS_PROHIBITED,
        )


############################
# DeleteUseCaseByCommand
############################


@router.delete("/command/{command}/delete", response_model=bool)
async def delete_use_case_by_command(command: str, user=Depends(get_verified_user)):
    use_case = UseCases.get_use_case_by_command(f"/{command}")
    if not use_case:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.NOT_FOUND,
        )

    if use_case.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES.ACCESS_PROHIBITED,
        )

    result = UseCases.delete_use_case_by_command(f"/{command}")
    return result