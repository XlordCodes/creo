"""Task 7.20 — Internal dashboard flow integration test.

Sequence (team member): Fetch Team Dashboard -> Fetch Tasks -> Request Task Assignment.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from main import app
from tests.conftest import auth_header, create_mock_token


def _mock_result(scalar_value=None, list_value=None):
    r = MagicMock()
    r.scalar_one_or_none.return_value = scalar_value
    r.scalars.return_value.all.return_value = list_value or []
    return r


class TestDashboardFlow:
    """Team Dashboard -> Tasks List -> Request Assignment."""

    @pytest.mark.asyncio
    async def test_full_dashboard_flow(self, mock_db_session: AsyncMock):
        user_id = str(uuid.uuid4())
        team_member_id = str(uuid.uuid4())
        token = create_mock_token(user_id, "team_member")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                # ----------------------------------------------------------
                # Step 1: GET /api/v1/dashboard/team
                # ----------------------------------------------------------
                team_member = MagicMock()
                team_member.id = team_member_id
                team_member.daily_cap_posters = 5
                team_member.daily_cap_reels = 3
                team_member.daily_cap_stories = 4

                today_task = MagicMock()
                today_task.id = str(uuid.uuid4())
                today_task.deliverable_type = MagicMock(value="poster")
                today_task.status = MagicMock(value="pending")
                today_task.priority = 1
                today_task.due_date = None

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=team_member),
                        _mock_result(scalar_value=2),
                        _mock_result(scalar_value=1),
                        _mock_result(scalar_value=0),
                        _mock_result(scalar_value=3),
                        _mock_result(scalar_value=0),
                        _mock_result(scalar_value=0),
                        _mock_result(scalar_value=False),
                        _mock_result(list_value=[(today_task, "Client Co")]),
                    ]
                )

                dash_resp = await ac.get(
                    "/api/v1/dashboard/team",
                    headers=headers,
                )
                assert dash_resp.status_code == 200
                dash_data = dash_resp.json()
                assert "daily_metrics" in dash_data
                assert dash_data["active_tasks_count"] == 3
                assert dash_data["overdue_tasks_count"] == 0
                assert isinstance(dash_data["today_tasks"], list)

                # ----------------------------------------------------------
                # Step 2: GET /api/v1/tasks
                # ----------------------------------------------------------
                task_obj = MagicMock()
                task_obj.id = str(uuid.uuid4())
                task_obj.client_id = str(uuid.uuid4())
                task_obj.assigned_to = team_member_id
                task_obj.deliverable_type = MagicMock(value="reel")
                task_obj.status = MagicMock(value="in_progress")
                task_obj.priority = 2
                task_obj.is_addon = False
                task_obj.assignment_date = None
                task_obj.due_date = None
                task_obj.submitted_at = None
                task_obj.created_at = MagicMock()
                task_obj.created_at.isoformat.return_value = "2026-06-20T00:00:00"
                task_obj.updated_at = None

                client_user = MagicMock()
                client_user.id = task_obj.client_id
                client_user.full_name = "Test Client"
                client_user.business_name = "Client Co"
                client_user.plan_name = MagicMock(value="growth")

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=team_member),
                        _mock_result(list_value=[(task_obj, client_user)]),
                    ]
                )

                tasks_resp = await ac.get(
                    "/api/v1/tasks",
                    headers=headers,
                )
                assert tasks_resp.status_code == 200
                tasks_data = tasks_resp.json()
                assert isinstance(tasks_data, list)
                assert len(tasks_data) >= 1

                # ----------------------------------------------------------
                # Step 3: POST /api/v1/tasks/{id}/request-assignment
                # ----------------------------------------------------------
                unassigned_task = MagicMock()
                unassigned_task.id = task_obj.id
                unassigned_task.assigned_to = None
                unassigned_task.status = MagicMock(value="pending")
                unassigned_task.requested_by = None
                unassigned_task.assignment_date = None

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=team_member),
                        _mock_result(scalar_value=unassigned_task),
                    ]
                )
                mock_db_session.commit = AsyncMock()

                async def _refresh_assignment(obj):
                    pass

                mock_db_session.refresh = AsyncMock(side_effect=_refresh_assignment)

                assign_resp = await ac.post(
                    f"/api/v1/tasks/{task_obj.id}/request-assignment",
                    headers=headers,
                )
                assert assign_resp.status_code == 200
                assert "successfully" in assign_resp.json()["message"].lower()

        finally:
            app.dependency_overrides.pop(get_db, None)

    @pytest.mark.asyncio
    async def test_assignment_rejects_already_assigned(
        self, mock_db_session: AsyncMock
    ):
        user_id = str(uuid.uuid4())
        team_member_id = str(uuid.uuid4())
        token = create_mock_token(user_id, "team_member")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                team_member = MagicMock()
                team_member.id = team_member_id

                assigned_task = MagicMock()
                assigned_task.id = str(uuid.uuid4())
                assigned_task.assigned_to = str(uuid.uuid4())

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=team_member),
                        _mock_result(scalar_value=assigned_task),
                    ]
                )

                resp = await ac.post(
                    f"/api/v1/tasks/{assigned_task.id}/request-assignment",
                    headers=headers,
                )
                assert resp.status_code == 409
                assert "already assigned" in resp.json()["detail"].lower()

        finally:
            app.dependency_overrides.pop(get_db, None)
