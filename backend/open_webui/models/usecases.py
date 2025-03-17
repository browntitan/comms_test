import time
from typing import Optional

from open_webui.internal.db import Base, get_db
from open_webui.models.users import Users, UserResponse

from pydantic import BaseModel, ConfigDict
from sqlalchemy import BigInteger, Column, String, Text, JSON

from open_webui.utils.access_control import has_access

####################
# Use Case DB Schema
####################


class UseCase(Base):
    __tablename__ = "use_case"

    command = Column(String, primary_key=True)
    user_id = Column(String)
    title = Column(Text)
    content = Column(Text)
    timestamp = Column(BigInteger)

    access_control = Column(JSON, nullable=True)  # Controls data access levels.
    # Defines access control rules for this entry.
    # - `None`: Public access, available to all users with the "user" role.
    # - `{}`: Private access, restricted exclusively to the owner.
    # - Custom permissions: Specific access control for reading and writing;
    #   Can specify group or user-level restrictions:
    #   {
    #      "read": {
    #          "group_ids": ["group_id1", "group_id2"],
    #          "user_ids":  ["user_id1", "user_id2"]
    #      },
    #      "write": {
    #          "group_ids": ["group_id1", "group_id2"],
    #          "user_ids":  ["user_id1", "user_id2"]
    #      }
    #   }


class UseCaseModel(BaseModel):
    command: str
    user_id: str
    title: str
    content: str
    timestamp: int  # timestamp in epoch

    access_control: Optional[dict] = None
    model_config = ConfigDict(from_attributes=True)


####################
# Forms
####################


class UseCaseUserResponse(UseCaseModel):
    user: Optional[UserResponse] = None


class UseCaseForm(BaseModel):
    command: str
    title: str
    content: str
    access_control: Optional[dict] = None


class UseCasesTable:
    def insert_new_use_case(
        self, user_id: str, form_data: UseCaseForm
    ) -> Optional[UseCaseModel]:
        use_case = UseCaseModel(
            **{
                "user_id": user_id,
                **form_data.model_dump(),
                "timestamp": int(time.time()),
            }
        )

        try:
            with get_db() as db:
                result = UseCase(**use_case.model_dump())
                db.add(result)
                db.commit()
                db.refresh(result)
                if result:
                    return UseCaseModel.model_validate(result)
                else:
                    return None
        except Exception:
            return None

    def get_use_case_by_command(self, command: str) -> Optional[UseCaseModel]:
        try:
            with get_db() as db:
                use_case = db.query(UseCase).filter_by(command=command).first()
                return UseCaseModel.model_validate(use_case)
        except Exception:
            return None

    def get_use_cases(self) -> list[UseCaseUserResponse]:
        with get_db() as db:
            use_cases = []

            for use_case in db.query(UseCase).order_by(UseCase.timestamp.desc()).all():
                user = Users.get_user_by_id(use_case.user_id)
                use_cases.append(
                    UseCaseUserResponse.model_validate(
                        {
                            **UseCaseModel.model_validate(use_case).model_dump(),
                            "user": user.model_dump() if user else None,
                        }
                    )
                )

            return use_cases

    def get_use_cases_by_user_id(
        self, user_id: str, permission: str = "write"
    ) -> list[UseCaseUserResponse]:
        use_cases = self.get_use_cases()

        return [
            use_case
            for use_case in use_cases
            if use_case.user_id == user_id
            or has_access(user_id, permission, use_case.access_control)
        ]

    def update_use_case_by_command(
        self, command: str, form_data: UseCaseForm
    ) -> Optional[UseCaseModel]:
        try:
            with get_db() as db:
                use_case = db.query(UseCase).filter_by(command=command).first()
                use_case.title = form_data.title
                use_case.content = form_data.content
                use_case.access_control = form_data.access_control
                use_case.timestamp = int(time.time())
                db.commit()
                return UseCaseModel.model_validate(use_case)
        except Exception:
            return None

    def delete_use_case_by_command(self, command: str) -> bool:
        try:
            with get_db() as db:
                db.query(UseCase).filter_by(command=command).delete()
                db.commit()
                return True
        except Exception:
            return False


UseCases = UseCasesTable()