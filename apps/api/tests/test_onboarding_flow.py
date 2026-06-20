"""Task 5.20 — Onboarding flow integration test.

Sequence: Register User -> Accept Terms -> Submit Questionnaire.
Mocks the Celery AI analysis background task so the test does not hang.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

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


class TestOnboardingFlow:
    """Register -> Accept Terms -> Submit Questionnaire (with Celery mocked)."""

    @pytest.mark.asyncio
    async def test_full_onboarding_flow(self, mock_db_session: AsyncMock):
        user_id = str(uuid.uuid4())
        auth_id = str(uuid.uuid4())
        token = create_mock_token(auth_id, "client")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                # ----------------------------------------------------------
                # Step 1: Register
                # ----------------------------------------------------------
                # query 1 (auth_id check) -> None, query 2 (email check) -> None
                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=None),
                        _mock_result(scalar_value=None),
                    ]
                )
                mock_db_session.add = MagicMock()
                mock_db_session.commit = AsyncMock()

                async def _refresh_register(obj):
                    obj.id = user_id

                mock_db_session.refresh = AsyncMock(side_effect=_refresh_register)

                reg_resp = await ac.post(
                    "/api/v1/auth/register",
                    json={
                        "auth_id": auth_id,
                        "email": "onboarding@test.com",
                        "full_name": "Onboarding User",
                        "phone": "+919876543210",
                        "business_name": "Test Co",
                    },
                    headers=headers,
                )
                assert reg_resp.status_code == 201
                reg_data = reg_resp.json()
                assert reg_data["email"] == "onboarding@test.com"
                assert reg_data["role"] == "client"

                # ----------------------------------------------------------
                # Step 2: Accept Terms
                # ----------------------------------------------------------
                current_user = MagicMock()
                current_user.id = user_id

                mock_db_session.execute = AsyncMock(
                    side_effect=[_mock_result(scalar_value=current_user)]
                )
                mock_db_session.commit = AsyncMock()

                terms_resp = await ac.post(
                    "/api/v1/onboarding/accept-terms",
                    headers=headers,
                )
                assert terms_resp.status_code == 200
                assert terms_resp.json()["status"] == "success"

                # ----------------------------------------------------------
                # Step 3: Submit Questionnaire (Celery task mocked)
                # ----------------------------------------------------------
                current_user_q = MagicMock()
                current_user_q.id = user_id

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=current_user_q),
                        _mock_result(scalar_value=None),
                    ]
                )
                mock_db_session.add = MagicMock()
                mock_db_session.commit = AsyncMock()

                with patch(
                    "routers.questionnaires.generate_ai_analysis",
                    create=True,
                ) as mock_task:
                    mock_task.delay = MagicMock()

                    q_resp = await ac.post(
                        "/api/v1/questionnaire",
                        json={
                            "industry": "Restaurant",
                            "business_description": "A fine dining restaurant",
                            "target_audience": {
                                "age": "25-45",
                                "location": "Mumbai",
                                "interests": "food",
                            },
                            "social_handles": {
                                "instagram": "@testrest",
                                "facebook": "",
                                "linkedin": "",
                            },
                            "current_posting_frequency": "weekly",
                            "content_what_works": "Reels",
                            "content_what_doesnt": "Long posts",
                            "primary_goal": "brand_awareness",
                            "brand_tone": ["Friendly", "Bold"],
                            "competitor_refs": ["@rival1"],
                            "topics_to_avoid": "Politics",
                            "style_references": [],
                        },
                        headers=headers,
                    )
                    assert q_resp.status_code == 201
                    assert q_resp.json()["status"] == "success"
                    mock_task.delay.assert_called_once_with(user_id)

        finally:
            app.dependency_overrides.pop(get_db, None)

    @pytest.mark.asyncio
    async def test_questionnaire_rejects_duplicate(
        self, mock_db_session: AsyncMock
    ):
        auth_id = str(uuid.uuid4())
        token = create_mock_token(auth_id, "client")

        async def override_get_db():
            yield mock_db_session

        app.dependency_overrides[get_db] = override_get_db
        transport = ASGITransport(app=app)

        try:
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                headers = auth_header(token)

                current_user = MagicMock()
                current_user.id = str(uuid.uuid4())

                existing_questionnaire = MagicMock()
                existing_questionnaire.user_id = current_user.id

                mock_db_session.execute = AsyncMock(
                    side_effect=[
                        _mock_result(scalar_value=current_user),
                        _mock_result(scalar_value=existing_questionnaire),
                    ]
                )

                resp = await ac.post(
                    "/api/v1/questionnaire",
                    json={
                        "industry": "Tech",
                        "business_description": "SaaS company",
                        "target_audience": {"age": "30-50", "location": "Global", "interests": "tech"},
                        "social_handles": {"instagram": "", "facebook": "", "linkedin": ""},
                        "primary_goal": "lead_generation",
                        "brand_tone": ["Professional"],
                    },
                    headers=headers,
                )
                assert resp.status_code == 409
                assert "already submitted" in resp.json()["detail"].lower()

        finally:
            app.dependency_overrides.pop(get_db, None)
