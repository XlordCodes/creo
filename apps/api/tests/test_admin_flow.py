"""Task 8.30 — Admin panel flow integration test.

Sequence (admin): Fetch Admin KPI -> Fetch Clients -> Update Scarcity Settings.
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


class TestAdminFlow:
    """Admin KPI -> Clients List -> Update Scarcity Settings."""

    @pytest.mark.asyncio
    async def test_full_admin_flow(self, mock_db_session: AsyncMock):
        user_id = str(uuid.uuid4())
        token = create_mock_token(user_id, "admin")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                # ----------------------------------------------------------
                # Step 1: GET /api/v1/admin/kpi
                # ----------------------------------------------------------
                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=80),
                        _mock_result(scalar_value=100),
                        _mock_result(scalar_value=5),
                        _mock_result(scalar_value=10),
                        _mock_result(scalar_value=8),
                        _mock_result(scalar_value=500000.0),
                        _mock_result(
                            list_value=[
                                (
                                    MagicMock(user_id=str(uuid.uuid4())),
                                    MagicMock(full_name="Designer A"),
                                ),
                                (
                                    MagicMock(user_id=str(uuid.uuid4())),
                                    MagicMock(full_name="Designer B"),
                                ),
                            ]
                        ),
                        _mock_result(scalar_value=6),
                        _mock_result(scalar_value=10),
                        _mock_result(scalar_value=4),
                        _mock_result(scalar_value=10),
                    ]
                )

                kpi_resp = await ac.get(
                    "/api/v1/admin/kpi",
                    headers=headers,
                )
                assert kpi_resp.status_code == 200
                kpi_data = kpi_resp.json()
                assert "delivery_rate_percentage" in kpi_data
                assert "team_capacity_bars" in kpi_data
                assert isinstance(kpi_data["team_capacity_bars"], list)

                # ----------------------------------------------------------
                # Step 2: GET /api/v1/admin/clients
                # ----------------------------------------------------------
                client_user = MagicMock()
                client_user.id = str(uuid.uuid4())
                client_user.full_name = "Client User"
                client_user.business_name = "Client Corp"
                client_user.email = "client@test.com"
                client_user.plan_name = MagicMock(value="growth")
                client_user.account_status = MagicMock(value="active")
                client_user.created_at = MagicMock()
                client_user.created_at.isoformat.return_value = "2026-06-01T00:00:00"

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(list_value=[client_user]),
                    ]
                )

                clients_resp = await ac.get(
                    "/api/v1/admin/clients",
                    headers=headers,
                )
                assert clients_resp.status_code == 200
                clients_data = clients_resp.json()
                assert isinstance(clients_data, list)
                assert len(clients_data) >= 1

                # ----------------------------------------------------------
                # Step 3: PATCH /api/v1/admin/settings (scarcity)
                # ----------------------------------------------------------
                existing_settings = MagicMock()
                existing_settings.id = "default"
                existing_settings.sla_delivery_days = 3
                existing_settings.sla_revision_hours = 48
                existing_settings.scarcity_slots_available = 5

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=existing_settings),
                    ]
                )
                mock_db_session.commit = AsyncMock()

                async def _refresh_settings(obj):
                    obj.scarcity_slots_available = 8

                mock_db_session.refresh = AsyncMock(side_effect=_refresh_settings)

                settings_resp = await ac.patch(
                    "/api/v1/admin/settings",
                    json={"scarcity_slots_available": 8},
                    headers=headers,
                )
                assert settings_resp.status_code == 200
                settings_data = settings_resp.json()
                assert settings_data["scarcity_slots_available"] == 8

        finally:
            app.dependency_overrides.pop(get_db, None)

    @pytest.mark.asyncio
    async def test_admin_settings_creates_default_if_missing(
        self, mock_db_session: AsyncMock
    ):
        user_id = str(uuid.uuid4())
        token = create_mock_token(user_id, "admin")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=None),
                    ]
                )
                mock_db_session.add = MagicMock()
                mock_db_session.flush = AsyncMock()

                async def _refresh_new(obj):
                    obj.id = "default"
                    obj.scarcity_slots_available = 10

                mock_db_session.refresh = AsyncMock(side_effect=_refresh_new)
                mock_db_session.commit = AsyncMock()

                resp = await ac.patch(
                    "/api/v1/admin/settings",
                    json={"scarcity_slots_available": 10},
                    headers=headers,
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["scarcity_slots_available"] == 10

        finally:
            app.dependency_overrides.pop(get_db, None)
