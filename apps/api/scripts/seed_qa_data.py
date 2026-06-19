"""
Creo QA Database Seeder
=======================
Populates the local database with realistic mock data for all 7 user journeys.

Usage:
    cd apps/api && python -m scripts.seed_qa_data

Prerequisites:
    - DATABASE_URL set in environment
    - All Alembic migrations applied (alembic upgrade head)
"""

import asyncio
import logging
import random
import sys
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, ".")

from core.config import DATABASE_URL
from models.addon import Addon, AddonPricing
from models.announcement import Announcement
from models.client_assignment import ClientAssignment
from models.content_calendar import ContentCalendar
from models.custom_pricing import CustomPricing
from models.deliverable import Deliverable, DeliverableComment
from models.enums import (
    AccountStatus,
    AddonStatus,
    Department,
    DeliverableStatus,
    DeliverableType,
    PaymentGateway,
    PlanName,
    TaskStatus,
    TicketStatus,
    TicketType,
    UserRole,
)
from models.escalation import Escalation
from models.leave import LeaveRequest
from models.notification import Notification
from models.plan import Plan
from models.questionnaire import Questionnaire
from models.subscription import Subscription
from models.task import Task
from models.team import TeamMember
from models.ticket import Ticket, TicketMessage
from models.user import User

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def _async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(_async_url(DATABASE_URL), echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

NOW = datetime.now(timezone.utc)
TODAY = date.today()


TABLES_TO_CLEAR = [
    User,
    Subscription,
    TeamMember,
    ClientAssignment,
    Task,
    Deliverable,
    DeliverableComment,
    Ticket,
    TicketMessage,
    Addon,
    AddonPricing,
    Notification,
    Escalation,
    Questionnaire,
    Announcement,
    CustomPricing,
    LeaveRequest,
    ContentCalendar,
]


async def _clear_existing_data(db: AsyncSession):
    logger.info("--- Clearing existing test data ---")
    for model in reversed(TABLES_TO_CLEAR):
        table = model.__tablename__
        try:
            await db.execute(delete(model))
            logger.info(f"  Cleared {table}")
        except Exception as exc:
            logger.warning(f"  Skipped {table}: {exc}")
    await db.commit()
    logger.info("--- Data cleared ---\n")


async def _seed_plans(db: AsyncSession) -> dict[str, Plan]:
    logger.info("--- Seeding plans ---")
    plans_data = [
        {
            "name": PlanName.starter,
            "display_name": "Starter",
            "monthly_price": 2999.00,
            "poster_quota": 3,
            "reel_quota": 2,
            "story_quota": 3,
            "revision_rounds": 1,
            "has_dedicated_manager": False,
        },
        {
            "name": PlanName.growth,
            "display_name": "Growth",
            "monthly_price": 5999.00,
            "poster_quota": 6,
            "reel_quota": 4,
            "story_quota": 6,
            "revision_rounds": 2,
            "has_dedicated_manager": False,
        },
        {
            "name": PlanName.pro,
            "display_name": "Pro",
            "monthly_price": 9999.00,
            "poster_quota": 6,
            "reel_quota": 4,
            "story_quota": 9,
            "revision_rounds": 3,
            "has_dedicated_manager": True,
        },
    ]

    plans: dict[str, Plan] = {}
    for p in plans_data:
        plan = Plan(**p, is_active=True)
        db.add(plan)
        await db.flush()
        plans[p["name"].value] = plan
        logger.info(f"  Plan: {p['display_name']} — ₹{p['monthly_price']}/mo | "
                     f"{p['poster_quota']} posters, {p['reel_quota']} reels, {p['story_quota']} stories")

    await db.commit()
    return plans


async def _seed_addon_pricing(db: AsyncSession):
    logger.info("--- Seeding addon pricing ---")
    for dtype, price in [
        (DeliverableType.poster, 499.00),
        (DeliverableType.reel, 999.00),
        (DeliverableType.story, 399.00),
    ]:
        db.add(AddonPricing(deliverable_type=dtype, unit_price=price, is_active=True))
        logger.info(f"  {dtype.value}: ₹{price}/unit")
    await db.commit()


async def _seed_super_admin(db: AsyncSession) -> User:
    logger.info("--- Seeding Super Admin ---")
    admin = User(
        auth_id="00000000-0000-0000-0000-000000000001",
        email="admin@creo-qa.com",
        phone="+919000000001",
        full_name="Zara Admin",
        business_name="Creo Internal",
        role=UserRole.super_admin,
        account_status=AccountStatus.active,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    logger.info(f"  admin@creo-qa.com | role=super_admin")
    return admin


async def _seed_team_members(db: AsyncSession) -> list[TeamMember]:
    logger.info("--- Seeding Team Members ---")
    specs = [
        {
            "email": "designer1@creo-qa.com",
            "phone": "+919000000002",
            "full_name": "Arjun Designer",
            "department": Department.graphics,
            "posters": 6, "reels": 0, "stories": 3,
        },
        {
            "email": "designer2@creo-qa.com",
            "phone": "+919000000003",
            "full_name": "Priya Videographer",
            "department": Department.video,
            "posters": 0, "reels": 4, "stories": 0,
        },
    ]

    members: list[TeamMember] = []
    for i, s in enumerate(specs):
        user = User(
            auth_id=f"00000000-0000-0000-0000-00000000000{i + 2}",
            email=s["email"],
            phone=s["phone"],
            full_name=s["full_name"],
            business_name="Creo Creative Team",
            role=UserRole.team_member,
            account_status=AccountStatus.active,
        )
        db.add(user)
        await db.flush()

        tm = TeamMember(
            user_id=user.id,
            department=s["department"],
            daily_cap_posters=s["posters"],
            daily_cap_reels=s["reels"],
            daily_cap_stories=s["stories"],
            is_active=True,
            joined_at=TODAY - timedelta(days=180),
        )
        db.add(tm)
        await db.flush()
        members.append(tm)
        logger.info(f"  {s['email']} | {s['department'].value} | "
                     f"cap: {s['posters']}p {s['reels']}r {s['stories']}s/day")

    await db.commit()
    return members


async def _seed_clients(
    db: AsyncSession,
    plans: dict[str, Plan],
    members: list[TeamMember],
    admin: User,
) -> list[User]:
    logger.info("--- Seeding Clients ---")
    specs = [
        {
            "email": "alice@creo-qa.com",
            "phone": "+919000000004",
            "full_name": "Alice Startup",
            "business_name": "Bloom Bakery",
            "plan_key": "starter",
            "gateway": PaymentGateway.razorpay,
        },
        {
            "email": "bob@creo-qa.com",
            "phone": "+919000000005",
            "full_name": "Bob Growth",
            "business_name": "FitVerse Gym",
            "plan_key": "growth",
            "gateway": PaymentGateway.stripe,
        },
        {
            "email": "charlie@creo-qa.com",
            "phone": "+919000000006",
            "full_name": "Charlie Enterprise",
            "business_name": "NovaTech Solutions",
            "plan_key": "pro",
            "gateway": PaymentGateway.razorpay,
        },
    ]

    clients: list[User] = []
    for i, s in enumerate(specs):
        user = User(
            auth_id=f"00000000-0000-0000-0000-00000000000{i + 4}",
            email=s["email"],
            phone=s["phone"],
            full_name=s["full_name"],
            business_name=s["business_name"],
            role=UserRole.client,
            account_status=AccountStatus.active,
            plan_name=PlanName(s["plan_key"]),
        )
        db.add(user)
        await db.flush()

        plan = plans[s["plan_key"]]
        start = NOW - timedelta(days=random.randint(1, 25))
        db.add(Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status="active",
            gateway=s["gateway"],
            gateway_subscription_id=f"sub_{s['plan_key']}_{i + 1}",
            gateway_customer_id=f"cust_{i + 1}",
            current_period_start=start,
            current_period_end=start + timedelta(days=30),
        ))

        db.add(Questionnaire(
            user_id=user.id,
            industry=random.choice(["Food & Beverage", "Fitness & Wellness", "Technology"]),
            business_description=f"{s['business_name']} is a leading brand in its space.",
            target_audience={"age_range": "25-40", "location": "India", "interests": ["fitness", "food"]},
            social_handles={"instagram": f"@{s['business_name'].lower().replace(' ', '')}"},
            current_posting_frequency="2-3 times per week",
            content_what_works="Behind-the-scenes content and customer stories",
            content_what_doesnt="Overly promotional posts",
            primary_goal=random.choice(["brand_awareness", "engagement", "lead_generation"]),
            brand_tone=["professional", "friendly", "energetic"],
            competitor_refs=["@competitor1", "@competitor2"],
            topics_to_avoid="Controversial topics",
            style_references=["@inspo1", "@inspo2"],
            ai_analysis={
                "tone_summary": "Professional yet approachable voice",
                "recommended_themes": ["Product showcases", "Customer stories", "Industry tips"],
                "audience_persona": "Young professionals aged 25-40 in urban India",
            },
            ai_summary_line=f"Professional voice, targeting young professionals, focused on "
                            f"{random.choice(['brand awareness', 'engagement', 'lead generation'])}",
            submitted_at=NOW - timedelta(days=random.randint(5, 20)),
        ))

        for tm in members:
            for dtype in [DeliverableType.poster, DeliverableType.reel]:
                db.add(ClientAssignment(
                    client_id=user.id,
                    team_member_id=tm.id,
                    deliverable_type=dtype,
                    assigned_by=admin.id,
                    is_active=True,
                ))

        clients.append(user)
        logger.info(f"  {s['email']} | plan={s['plan_key']} | gateway={s['gateway'].value}")

    await db.commit()
    return clients


async def _seed_addons(db: AsyncSession, clients: list[User]) -> list[Addon]:
    logger.info("--- Seeding Add-ons ---")
    addons: list[Addon] = []
    for client_idx, dtype, qty, price in [
        (1, DeliverableType.reel, 2, 999.00),
        (2, DeliverableType.poster, 3, 499.00),
    ]:
        addon = Addon(
            user_id=clients[client_idx].id,
            deliverable_type=dtype,
            quantity=qty,
            unit_price=price,
            total_price=qty * price,
            status=AddonStatus.completed,
            gateway=PaymentGateway.razorpay,
            payment_id=f"pay_addon_{len(addons) + 1}",
        )
        db.add(addon)
        await db.flush()
        addons.append(addon)
        logger.info(f"  {qty}x {dtype.value} for {clients[client_idx].full_name}")

    await db.commit()
    return addons


async def _seed_tasks_and_deliverables(
    db: AsyncSession,
    clients: list[User],
    members: list[TeamMember],
    admin: User,
) -> list[Task]:
    logger.info("--- Seeding Tasks & Deliverables ---")
    task_specs = [
        (0, 0, DeliverableType.poster, TaskStatus.pending, "Summer sale poster for Bloom Bakery"),
        (0, 0, DeliverableType.poster, TaskStatus.in_progress, "New menu announcement creative"),
        (0, 0, DeliverableType.story, TaskStatus.submitted, "Customer testimonial story"),
        (1, 1, DeliverableType.reel, TaskStatus.pending, "Gym transformation reel"),
        (1, 1, DeliverableType.reel, TaskStatus.in_progress, "Trainer introduction reel"),
        (1, 1, DeliverableType.reel, TaskStatus.submitted, "Class schedule promo reel"),
        (1, 1, DeliverableType.poster, TaskStatus.approved, "Membership offer poster"),
        (2, 0, DeliverableType.poster, TaskStatus.submitted, "Product launch poster for NovaTech"),
        (2, 0, DeliverableType.story, TaskStatus.in_progress, "Behind-the-scenes story"),
        (2, 1, DeliverableType.reel, TaskStatus.pending, "Software demo reel"),
        (2, 1, DeliverableType.reel, TaskStatus.overdue, "Client testimonial reel — SLA breached"),
        (0, 0, DeliverableType.poster, TaskStatus.approved, "Festival greeting poster"),
        (1, 1, DeliverableType.reel, TaskStatus.approved, "Workout tips reel"),
        (2, 0, DeliverableType.poster, TaskStatus.revision, "Logo redesign poster — client rejected"),
        (0, 0, DeliverableType.story, TaskStatus.submitted, "Daily specials story"),
    ]

    tasks: list[Task] = []
    deliverables_created = 0

    for ci, mi, dtype, status, brief in task_specs:
        client = clients[ci]
        member = members[mi]
        days_ago = random.randint(0, 5)
        assign_date = TODAY - timedelta(days=days_ago)

        task = Task(
            client_id=client.id,
            assigned_to=member.id,
            assigned_by=admin.id,
            deliverable_type=dtype,
            content_brief=brief,
            status=status,
            priority=random.randint(1, 3),
            is_addon=False,
            assignment_date=assign_date,
            due_date=assign_date + timedelta(days=3),
            submitted_at=NOW - timedelta(hours=random.randint(1, 48))
            if status in (TaskStatus.submitted, TaskStatus.approved) else None,
        )
        db.add(task)
        await db.flush()
        tasks.append(task)

        if status in (TaskStatus.submitted, TaskStatus.approved, TaskStatus.revision):
            ext = "jpg" if dtype in (DeliverableType.poster, DeliverableType.story) else "mp4"
            d_status = (
                DeliverableStatus.approved if status == TaskStatus.approved
                else DeliverableStatus.rejected if status == TaskStatus.revision
                else DeliverableStatus.pending_approval
            )
            db.add(Deliverable(
                task_id=task.id,
                client_id=client.id,
                submitted_by=member.id,
                file_url=f"deliverables/{client.id}/{task.id}.{ext}",
                file_type=ext,
                file_size_bytes=random.randint(500_000, 15_000_000),
                status=d_status,
                revision_round=1 if status != TaskStatus.revision else 2,
            ))
            deliverables_created += 1

    await db.commit()
    logger.info(f"  {len(tasks)} tasks, {deliverables_created} deliverables")

    by_status: dict[str, int] = {}
    for t in tasks:
        by_status[t.status.value] = by_status.get(t.status.value, 0) + 1
    for s, c in sorted(by_status.items()):
        logger.info(f"    {s}: {c}")

    return tasks


async def _seed_tickets(
    db: AsyncSession,
    clients: list[User],
    members: list[TeamMember],
    admin: User,
) -> list[Ticket]:
    logger.info("--- Seeding Tickets ---")
    ticket_specs = [
        (0, TicketType.deliverable_revision, "Revisions needed on poster design",
         "The colour scheme doesn't match our brand guidelines. Please use primary blue #2B7BC4.",
         TicketStatus.open),
        (1, TicketType.general_support, "How to connect Instagram account?",
         "I can't find the Instagram connection option in my account settings.",
         TicketStatus.in_progress),
        (2, TicketType.billing_issue, "Double charged this month",
         "I was charged twice on June 1st. Please refund the duplicate charge.",
         TicketStatus.open),
    ]

    tickets: list[Ticket] = []
    for ci, ttype, subject, desc, status in ticket_specs:
        client = clients[ci]
        ticket = Ticket(
            user_id=client.id,
            ticket_type=ttype,
            subject=subject,
            description=desc,
            status=status,
            assigned_to=admin.id,
            created_at=NOW - timedelta(days=random.randint(1, 5)),
        )
        db.add(ticket)
        await db.flush()
        tickets.append(ticket)

        db.add(TicketMessage(
            ticket_id=ticket.id,
            sender_id=client.id,
            message_text=desc,
        ))

        if status == TicketStatus.in_progress:
            db.add(TicketMessage(
                ticket_id=ticket.id,
                sender_id=admin.id,
                message_text="Thanks for reaching out! We're looking into this and will respond within 24 hours.",
            ))

    await db.commit()
    logger.info(f"  {len(tickets)} tickets")
    for t in tickets:
        logger.info(f"    [{t.status.value}] {t.subject}")
    return tickets


async def _seed_escalation(
    db: AsyncSession,
    tasks: list[Task],
    clients: list[User],
    admin: User,
):
    logger.info("--- Seeding Escalation ---")
    overdue = next((t for t in tasks if t.status == TaskStatus.overdue), tasks[0])
    client = next(c for c in clients if c.id == overdue.client_id)

    db.add(Escalation(
        task_id=overdue.id,
        client_id=client.id,
        assigned_to=admin.id,
        severity=2,
        reason="SLA breached — deliverable not submitted within 3 business days",
        status="open",
    ))
    await db.commit()
    logger.info(f"  Open escalation for {client.full_name} (task overdue)")


async def _seed_notifications(
    db: AsyncSession,
    clients: list[User],
    members: list[TeamMember],
):
    logger.info("--- Seeding Notifications ---")
    templates = [
        ("deliverable", "New deliverable ready", "Your poster is ready for review."),
        ("ticket", "Ticket updated", "Your support ticket has been updated."),
        ("payment", "Payment confirmed", "Your monthly payment has been processed."),
        ("deliverable", "Revised deliverable ready", "Your revised reel is ready for review."),
        ("system", "Welcome to Creo", "Your account is now active. Start exploring your dashboard!"),
    ]

    count = 0
    for client in clients[:2]:
        for ntype, title, msg in random.sample(templates, 3):
            db.add(Notification(
                user_id=client.id,
                type=ntype,
                title=title,
                message=msg,
                is_read=random.choice([True, False]),
                created_at=NOW - timedelta(hours=random.randint(1, 72)),
            ))
            count += 1

    await db.commit()
    logger.info(f"  {count} notifications")


async def main():
    if not DATABASE_URL:
        logger.error("DATABASE_URL is not set in environment.")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("  CREO QA DATABASE SEEDER")
    logger.info("=" * 60)

    async with async_session() as db:
        await _clear_existing_data(db)
        plans = await _seed_plans(db)
        await _seed_addon_pricing(db)
        admin = await _seed_super_admin(db)
        members = await _seed_team_members(db)
        clients = await _seed_clients(db, plans, members, admin)
        addons = await _seed_addons(db, clients)
        tasks = await _seed_tasks_and_deliverables(db, clients, members, admin)
        tickets = await _seed_tickets(db, clients, members, admin)
        await _seed_escalation(db, tasks, clients, admin)
        await _seed_notifications(db, clients, members)

    logger.info("\n" + "=" * 60)
    logger.info("  SEEDING COMPLETE")
    logger.info("=" * 60)

    logger.info("\n  ┌─────────────────────────────────────────────────────┐")
    logger.info("  │  TEST CREDENTIALS                                   │")
    logger.info("  ├─────────────────────────────────────────────────────┤")
    logger.info("  │  SUPER ADMIN                                        │")
    logger.info("  │    email:    admin@creo-qa.com                      │")
    logger.info("  │    role:     super_admin                             │")
    logger.info("  │                                                     │")
    logger.info("  │  TEAM MEMBERS                                       │")
    logger.info("  │    designer1@creo-qa.com  | Graphics | 6p 3s/day   │")
    logger.info("  │    designer2@creo-qa.com  | Video    | 4 reels/day │")
    logger.info("  │                                                     │")
    logger.info("  │  CLIENTS                                            │")
    logger.info("  │    alice@creo-qa.com   | Starter | Razorpay        │")
    logger.info("  │    bob@creo-qa.com     | Growth  | Stripe          │")
    logger.info("  │    charlie@creo-qa.com | Pro     | Razorpay        │")
    logger.info("  └─────────────────────────────────────────────────────┘")

    logger.info("\n  DATA SUMMARY:")
    logger.info(f"    Plans:          3 (Starter, Growth, Pro)")
    logger.info(f"    Users:          6 (1 admin, 2 team, 3 clients)")
    logger.info(f"    Subscriptions:  3 active")
    logger.info(f"    Tasks:          {len(tasks)}")
    logger.info(f"    Tickets:        {len(tickets)}")
    logger.info(f"    Escalations:    1 open")
    logger.info(f"    Notifications:  seeded")
    logger.info("=" * 60)
    logger.info(
        "\n  NOTE: auth_id values are deterministic UUIDs above."
        "\n  To test as a specific user, create a mock JWT with the"
        "\n  corresponding auth_id as the 'sub' claim."
    )
    logger.info("")


if __name__ == "__main__":
    asyncio.run(main())
