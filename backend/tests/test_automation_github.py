import json

import httpx
import pytest

from src.automation.github.client import GitHubClient


@pytest.mark.asyncio
async def test_create_issue():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/repos/acme/redthread/issues"
        body = json.loads(request.content)
        assert body["title"] == "Task: Arreglar login"
        assert body["labels"] == ["task"]
        return httpx.Response(
            201,
            json={
                "number": 5,
                "html_url": "https://github.com/acme/redthread/issues/5",
                "state": "open",
                "labels": [{"name": "task"}],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubClient(token="gh-token", repo="acme/redthread")
        issue = await github.create_issue("Task: Arreglar login", "", ["task"], client=client)

    assert issue["number"] == 5
    assert issue["state"] == "open"


@pytest.mark.asyncio
async def test_close_issue_adds_comment():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "PATCH":
            assert request.url.path == "/repos/acme/redthread/issues/5"
            assert json.loads(request.content) == {"state": "closed"}
            return httpx.Response(200, json={"number": 5, "state": "closed"})
        if request.method == "POST":
            assert request.url.path == "/repos/acme/redthread/issues/5/comments"
            return httpx.Response(201, json={"id": 1})
        raise AssertionError("method inesperado")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubClient(token="gh-token", repo="acme/redthread")
        issue = await github.close_issue(5, comment="✅ Hecho desde Telegram", client=client)

    assert issue["state"] == "closed"


@pytest.mark.asyncio
async def test_add_labels():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/repos/acme/redthread/issues/5/labels"
        assert json.loads(request.content) == {"labels": ["done"]}
        return httpx.Response(200, json=[{"name": "done"}])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubClient(token="gh-token", repo="acme/redthread")
        labels = await github.add_labels(5, ["done"], client=client)

    assert labels == [{"name": "done"}]


@pytest.mark.asyncio
async def test_list_issues_filters_labels():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/repos/acme/redthread/issues"
        assert request.url.params["labels"] == "task"
        return httpx.Response(200, json=[{"number": 5, "state": "open"}])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubClient(token="gh-token", repo="acme/redthread")
        issues = await github.list_issues(state="open", labels=["task"], client=client)

    assert issues == [{"number": 5, "state": "open"}]


@pytest.mark.asyncio
async def test_ensure_labels_creates_missing():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            assert request.url.path == "/repos/acme/redthread/labels"
            return httpx.Response(200, json=[{"name": "idea"}])
        if request.method == "POST":
            assert request.url.path == "/repos/acme/redthread/labels"
            body = json.loads(request.content)
            assert body["name"] == "task"
            return httpx.Response(201, json={"name": "task"})
        raise AssertionError("method inesperado")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        github = GitHubClient(token="gh-token", repo="acme/redthread")
        result = await github.ensure_labels(["idea", "task"], client=client)

    assert result == {"idea": True, "task": True}
