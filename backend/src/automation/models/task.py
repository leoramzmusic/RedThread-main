from typing import List

from pydantic import BaseModel, Field


class TaskItem(BaseModel):
    number: int
    title: str = ""
    state: str = "open"
    labels: List[str] = Field(default_factory=list)
    html_url: str = ""

    @classmethod
    def from_issue(cls, issue: dict) -> "TaskItem":
        return cls(
            number=issue.get("number", 0),
            title=issue.get("title", ""),
            state=issue.get("state", "open"),
            labels=[label.get("name", "") for label in issue.get("labels", [])],
            html_url=issue.get("html_url", ""),
        )