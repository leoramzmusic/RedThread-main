from __future__ import annotations

from typing import Dict, List, Optional

import httpx


class GitHubClient:
    """Cliente asíncrono sobre la GitHub REST API (issues y labels)."""

    DEFAULT_API_BASE = "https://api.github.com"

    def __init__(self, token: str, repo: str, api_base: str = DEFAULT_API_BASE) -> None:
        self._token = token
        self._repo = repo.strip("/")
        self._base = api_base.rstrip("/")

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _issues_url(self, number: Optional[int] = None) -> str:
        base = f"{self._base}/repos/{self._repo}/issues"
        return base if number is None else f"{base}/{number}"

    async def create_issue(
        self,
        title: str,
        body: str,
        labels: List[str],
        client: Optional[httpx.AsyncClient] = None,
    ) -> dict:
        payload = {"title": title, "body": body, "labels": labels}
        if client is not None:
            response = await client.post(self._issues_url(), headers=self._headers(), json=payload)
        else:
            async with httpx.AsyncClient() as session:
                response = await session.post(
                    self._issues_url(), headers=self._headers(), json=payload
                )
        response.raise_for_status()
        return response.json()

    async def add_comment(
        self,
        number: int,
        body: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> dict:
        url = f"{self._issues_url(number)}/comments"
        if client is not None:
            response = await client.post(url, headers=self._headers(), json={"body": body})
        else:
            async with httpx.AsyncClient() as session:
                response = await session.post(url, headers=self._headers(), json={"body": body})
        response.raise_for_status()
        return response.json()

    async def close_issue(
        self,
        number: int,
        comment: Optional[str] = None,
        client: Optional[httpx.AsyncClient] = None,
    ) -> dict:
        if client is not None:
            response = await client.patch(
                self._issues_url(number), headers=self._headers(), json={"state": "closed"}
            )
        else:
            async with httpx.AsyncClient() as session:
                response = await session.patch(
                    self._issues_url(number), headers=self._headers(), json={"state": "closed"}
                )
        response.raise_for_status()
        if comment:
            await self.add_comment(number, comment, client=client)
        return response.json()

    async def add_labels(
        self,
        number: int,
        names: List[str],
        client: Optional[httpx.AsyncClient] = None,
    ) -> dict:
        url = f"{self._issues_url(number)}/labels"
        if client is not None:
            response = await client.post(url, headers=self._headers(), json={"labels": names})
        else:
            async with httpx.AsyncClient() as session:
                response = await session.post(url, headers=self._headers(), json={"labels": names})
        response.raise_for_status()
        return response.json()

    async def list_issues(
        self,
        state: str = "open",
        labels: Optional[List[str]] = None,
        client: Optional[httpx.AsyncClient] = None,
    ) -> List[dict]:
        params: Dict[str, object] = {"state": state, "per_page": 100}
        if labels:
            params["labels"] = ",".join(labels)
        if client is not None:
            response = await client.get(self._issues_url(), headers=self._headers(), params=params)
        else:
            async with httpx.AsyncClient() as session:
                response = await session.get(
                    self._issues_url(), headers=self._headers(), params=params
                )
        response.raise_for_status()
        return response.json()

    async def ensure_labels(
        self,
        names: List[str],
        client: Optional[httpx.AsyncClient] = None,
    ) -> Dict[str, bool]:
        """Crea los labels que falten y devuelve {nombre: existe_y_ok}."""
        result: Dict[str, bool] = {}
        if client is not None:
            await self._ensure_labels_inner(client, names, result)
        else:
            async with httpx.AsyncClient() as session:
                await self._ensure_labels_inner(session, names, result)
        return result

    async def _ensure_labels_inner(
        self,
        session: httpx.AsyncClient,
        names: List[str],
        result: Dict[str, bool],
    ) -> None:
        list_response = await session.get(
            f"{self._base}/repos/{self._repo}/labels",
            headers=self._headers(),
        )
        list_response.raise_for_status()
        existing = {item["name"] for item in list_response.json()}
        for name in names:
            if name in existing:
                result[name] = True
                continue
            create_response = await session.post(
                f"{self._base}/repos/{self._repo}/labels",
                headers=self._headers(),
                json={"name": name, "color": "0366d6"},
            )
            create_response.raise_for_status()
            result[name] = True