from pydantic import BaseModel


class UserRead(BaseModel):
    id: int
    email: str
    name: str
    picture: str | None

    model_config = {"from_attributes": True}
