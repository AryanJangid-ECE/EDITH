from __future__ import annotations

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(min_length=1, max_length=2000, strip_whitespace=True)]

    @field_validator("content", mode="before")
    @classmethod
    def remove_control_characters(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return "".join(
            char for char in value if char in "\n\t" or ord(char) >= 32 and ord(char) != 127
        )


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage] = Field(min_length=1, max_length=16)

    @model_validator(mode="after")
    def validate_conversation(self) -> ChatRequest:
        if self.messages[-1].role != "user":
            raise ValueError("The latest message must be from the user")
        if any(
            previous.role == current.role
            for previous, current in zip(self.messages, self.messages[1:], strict=False)
        ):
            raise ValueError("Conversation messages must alternate between user and assistant")
        if sum(len(message.content) for message in self.messages) > 12_000:
            raise ValueError("Conversation content exceeds the maximum size")
        return self


class ChatResponse(BaseModel):
    reply: str


class AssistantStatus(BaseModel):
    available: bool
    message: str | None = None
