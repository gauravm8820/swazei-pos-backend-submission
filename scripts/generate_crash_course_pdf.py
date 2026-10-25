#!/usr/bin/env python3
"""
Fast-Track 2-Hour Interview Crash Course Generator
Multi-Tenant POS Backend System
Author: Gaurav Mishra
Target: /Users/gauravmishra/Projects/merchantFolder/POS_Interview_Fast_Track_Crash_Course.pdf
"""

import sys
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(40, letter[1] - 30, "POS SYSTEM — 2-HOUR FAST-TRACK INTERVIEW CRASH COURSE")
        self.drawRightString(letter[0] - 40, letter[1] - 30, "GAURAV MISHRA")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, letter[1] - 34, letter[0] - 40, letter[1] - 34)

        # Running Footer
        self.line(40, 35, letter[0] - 40, 35)
        self.drawString(40, 24, "Swazei Tech Senior Backend Submission — High-Impact Interview Prep")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(letter[0] - 40, 24, page_str)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=42,
    )

    PRIMARY = colors.HexColor("#0f172a")
    SECONDARY = colors.HexColor("#1e293b")
    ACCENT_TEAL = colors.HexColor("#0d9488")
    ACCENT_BLUE = colors.HexColor("#2563eb")
    ACCENT_EMERALD = colors.HexColor("#059669")
    BORDER_GRAY = colors.HexColor("#cbd5e1")
    TEXT_MAIN = colors.HexColor("#334155")

    styles = {
        'DocTitle': ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=PRIMARY, alignment=1),
        'DocSubtitle': ParagraphStyle('DocSubtitle', fontName='Helvetica', fontSize=10, leading=14, textColor=ACCENT_TEAL, alignment=1),
        'H1': ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=PRIMARY, spaceBefore=10, spaceAfter=4, keepWithNext=True),
        'H2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=ACCENT_TEAL, spaceBefore=6, spaceAfter=3, keepWithNext=True),
        'Body': ParagraphStyle('Body', fontName='Helvetica', fontSize=8.5, leading=12, textColor=TEXT_MAIN, spaceAfter=4),
        'BodyBold': ParagraphStyle('BodyBold', fontName='Helvetica-Bold', fontSize=8.5, leading=12, textColor=PRIMARY, spaceAfter=4),
        'Bullet': ParagraphStyle('Bullet', fontName='Helvetica', fontSize=8.5, leading=12, textColor=TEXT_MAIN, leftIndent=10, firstLineIndent=-7, spaceAfter=2),
        'CodeSnippet': ParagraphStyle('CodeSnippet', fontName='Courier', fontSize=7, leading=9, textColor=colors.HexColor("#0f172a")),
        'BoxText': ParagraphStyle('BoxText', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#1e3a8a")),
        'BoxTitle': ParagraphStyle('BoxTitle', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=colors.HexColor("#1e40af"), spaceAfter=2),
        'GreenBoxText': ParagraphStyle('GreenBoxText', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#065f46")),
        'GreenBoxTitle': ParagraphStyle('GreenBoxTitle', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=colors.HexColor("#047857"), spaceAfter=2),
        'TableHead': ParagraphStyle('TableHead', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.white),
        'TableCell': ParagraphStyle('TableCell', fontName='Helvetica', fontSize=7, leading=9.5, textColor=TEXT_MAIN),
        'TableCellBold': ParagraphStyle('TableCellBold', fontName='Helvetica-Bold', fontSize=7, leading=9.5, textColor=PRIMARY),
    }

    story = []

    def p(text, style_name='Body'):
        return Paragraph(text, styles[style_name])

    def callout(title, text, kind='blue'):
        t_style = 'GreenBoxTitle' if kind == 'green' else 'BoxTitle'
        b_style = 'GreenBoxText' if kind == 'green' else 'BoxText'
        bg_col = colors.HexColor("#f0fdf4") if kind == 'green' else colors.HexColor("#f0f9ff")
        b_col = ACCENT_EMERALD if kind == 'green' else ACCENT_BLUE

        cell = [
            Paragraph(f"<b>{title}</b>", styles[t_style]),
            Spacer(1, 1),
            Paragraph(text, styles[b_style])
        ]
        t = Table([[cell]], colWidths=[letter[0] - 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_col),
            ('BOX', (0,0), (-1,-1), 0.75, b_col),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    def code_box(code_str):
        p_code = Preformatted(code_str, styles['CodeSnippet'])
        t = Table([[p_code]], colWidths=[letter[0] - 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_GRAY),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    # HEADER TITLE
    story.append(p("Multi-Tenant POS Backend — 2-Hour Fast-Track Interview Sheet", 'DocTitle'))
    story.append(Spacer(1, 2))
    story.append(p("The High-Impact Summary: Core Story, Architectural Decisions, Code Highlights & Q&A Prep", 'DocSubtitle'))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_TEAL, spaceBefore=4, spaceAfter=8))

    # SECTION 1: 2-MINUTE ELEVATOR PITCH
    story.append(p("1. Your Spoken Elevator Pitch (Say This First)", 'H1'))
    story.append(callout(
        "\"Tell me about your project\" — Memorize This 60-Second Response:",
        "\"I engineered a high-concurrency, multi-tenant Point of Sale backend in NestJS, PostgreSQL, and Redis. "
        "It solves the 3 biggest problems in retail software: <b>inventory overselling during flash sales</b>, <b>duplicate payments on network drops</b>, and <b>cross-tenant data leakage</b>.<br/><br/>"
        "To guarantee zero overselling, I implemented row-level pessimistic locking (<b>SELECT FOR UPDATE</b>) in TypeORM with <b>ascending product ID sorting</b> to mathematically prevent deadlocks, backed by a database <b>CHECK (quantity >= 0)</b> constraint.<br/>"
        "To prevent double charges, I created a distributed <b>Idempotency Interceptor</b> that hashes the payload with SHA-256 and replays cached receipts on retries.<br/>"
        "To prevent connection pool exhaustion, I used a <b>Two-Phase SAGA</b>: stock is decremented in milliseconds, locks are released, and payment is processed outside the database transaction with an automated compensating rollback if payment fails.<br/>"
        "Catalog reads and tenant checks are cached in <b>Redis</b> with write-through invalidation, and the whole system is covered by automated Jest concurrency and e2e tests.\"",
        'green'
    ))

    # SECTION 2: THE 3-MINUTE STORY (KAHANI)
    story.append(Spacer(1, 4))
    story.append(p("2. The Story Behind the Project (Explain the Problem)", 'H1'))
    story.append(p(
        "<b>The Problem:</b> Ramesh owns a specialty coffee chain called <i>'Chai & Roast'</i> with stores in Bengaluru and Mumbai. "
        "With off-the-shelf POS software, he had 3 recurring nightmares: "
        "(1) <b>Ghost Stock:</b> When 1 bag of beans remained, two cashiers rang it up simultaneously and stock dropped to -1. "
        "(2) <b>Double Swipe:</b> Airport store Wi-Fi lagged, cashier hit 'Pay' twice, charging customer twice. "
        "(3) <b>Data Leaks:</b> Store managers could see competitor tenant sales numbers.<br/>"
        "<b>The Solution:</b> This backend provides mathematical guarantees: inventory can never oversell, retries never double charge, tenants are strictly isolated, and money is tracked in 100% exact integer minor units (paise)."
    ))

    # SECTION 3: THE 4 ROLES & HIERARCHY
    story.append(Spacer(1, 4))
    story.append(p("3. Roles & Permissions Hierarchy (RBAC)", 'H1'))
    story.append(p(
        "Our system uses a <b>numeric hierarchy</b> evaluated in <code>src/common/guards/roles.guard.ts</code>: "
        "<code>OWNER (4) > ADMIN (3) > MANAGER (2) > CASHIER (1)</code>."
    ))

    roles_data = [
        [p("Role", 'TableHead'), p("Level", 'TableHead'), p("Scope", 'TableHead'), p("What They Can Do", 'TableHead'), p("What They CANNOT Do", 'TableHead')],
        [p("<b>OWNER</b>", 'TableCellBold'), p("4", 'TableCell'), p("Merchant", 'TableCell'), p("Full corporate control: Update merchant info, deactivate stores, create Admins/Managers/Cashiers, view all store sales."), p("Cannot access Tenant B data.")],
        [p("<b>ADMIN</b>", 'TableCellBold'), p("3", 'TableCell'), p("Merchant", 'TableCell'), p("Manage operations: Create stores, create users (POST /users), create/edit products, manage catalog."), p("Cannot deactivate stores or change corporate details.")],
        [p("<b>MANAGER</b>", 'TableCellBold'), p("2", 'TableCell'), p("Store", 'TableCell'), p("Store supervisor: View assigned store, set stock levels (PUT /inventory/:pId), view cashiers and sales."), p("Cannot create stores, create users, or edit other stores.")],
        [p("<b>CASHIER</b>", 'TableCellBold'), p("1", 'TableCell'), p("Store", 'TableCell'), p("POS counter operator: Browse products, check stock, process sales (POST /sales), print receipts."), p("Cannot adjust stock directly, create users, or access other stores.")],
    ]
    t_roles = Table(roles_data, colWidths=[55, 30, 50, 220, 175])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_roles)
    story.append(p("<b>Key Rule:</b> OWNER & ADMIN do not need a store ID. MANAGER & CASHIER <i>must</i> be assigned to a specific store ID.", 'Bullet'))

    # PAGE BREAK FOR DEEP TECHNICAL HIGHLIGHTS
    story.append(PageBreak())

    # SECTION 4: THE 3 CORE TECHNICAL HIGHLIGHTS
    story.append(p("4. The 3 Technical Highlights (Interview Winning Points)", 'H1'))

    story.append(p("Highlight A: Pessimistic Row Locking & Deadlock Prevention", 'H2'))
    story.append(p(
        "In <code>src/modules/inventory/inventory.repository.ts</code>, we execute <code>setLock('pessimistic_write')</code> which generates SQL <code>SELECT ... FOR UPDATE</code>. "
        "PostgreSQL locks the specific inventory rows until the transaction commits."
    ))
    code_h1 = """// Deadlock Prevention in SalesService:
const sortedProductIds = [...productIds].sort(); // 1. Always sort IDs ascending!
const lockedInventory = await this.inventoryRepo.lockAndFetchForUpdate(em, storeId, sortedProductIds);
// Why sort? If Tx1 locks (A then B) while Tx2 locks (B then A), a circular deadlock happens.
// Sorting guarantees ALL transactions lock resources in identical order -> ZERO DEADLOCKS!"""
    story.append(code_box(code_h1))

    story.append(p("Highlight B: Two-Phase SAGA with Compensation (Payment Outside DB Lock)", 'H2'))
    story.append(p(
        "<b>Senior Dev Insight:</b> Never make third-party HTTP calls (Stripe/Razorpay) inside an open database transaction. If the gateway takes 4 seconds, database locks stay open and exhaust your connection pool."
    ))
    code_h2 = """// Two-Phase SAGA in SalesService:
// PHASE 1: DB Transaction (< 5ms) -> Lock stock, validate qty, decrement stock, COMMIT & release locks!
// PHASE 2: External HTTP -> Call paymentPort.charge() OUTSIDE the transaction (zero DB locks held).
// OUTCOME:
// - If Payment SUCCESS -> DB Transaction 2A marks sale PAID and records payment.
// - If Payment FAILED  -> DB Transaction 2B executes COMPENSATION: increments stock back to original!"""
    story.append(code_box(code_h2))

    story.append(p("Highlight C: Distributed Idempotency Interceptor (Network Retry Safety)", 'H2'))
    story.append(p(
        "In <code>src/common/interceptors/idempotency.interceptor.ts</code>: Clients send an <code>Idempotency-Key</code> header (UUID). "
        "The interceptor hashes <code>method + path + JSON body</code> using SHA-256."
    ))
    code_h3 = """// Replay Logic:
if (existingKey.isCompleted) {
  if (existingKey.requestHash !== currentHash) throw new UnprocessableEntityException('Key reused with different payload');
  res.setHeader('X-Idempotency-Replayed', 'true'); // Instant replay from DB cache!
  return of(existingKey.responseBody);
}"""
    story.append(code_box(code_h3))

    # SECTION 5: DATABASE SCHEMA & CONSTRAINTS
    story.append(Spacer(1, 4))
    story.append(p("5. Database Design & Integrity (9 Tables)", 'H1'))
    story.append(p("<b>1. Absolute Zero-Oversell Guarantee:</b> <code>CONSTRAINT \"CHK_store_inventory_quantity\" CHECK (\"quantity\" >= 0)</code> in Postgres. Physical guarantee.", 'Bullet'))
    story.append(p("<b>2. Integer Minor Units (BigInt):</b> All money is stored in paise (₹450.00 = <code>45000</code>). Eliminates IEEE 754 floating-point rounding errors.", 'Bullet'))
    story.append(p("<b>3. Immutable Price Snapshots:</b> <code>sale_items</code> stores <code>unitPriceSnapshot</code> so future catalog price changes never alter past receipts.", 'Bullet'))
    story.append(p("<b>4. Core Tables:</b> <code>merchants</code>, <code>stores</code>, <code>users</code>, <code>products</code>, <code>store_inventory</code>, <code>sales</code>, <code>sale_items</code>, <code>payments</code>, <code>idempotency_keys</code>.", 'Bullet'))

    # PAGE BREAK FOR INTERVIEW Q&A
    story.append(PageBreak())

    # SECTION 6: TOP 10 INTERVIEW QUESTIONS & MODEL ANSWERS
    story.append(p("6. Top 10 Toughest Interview Questions & Exact Spoken Answers", 'H1'))

    qa_list = [
        ("Q1: How do you prevent inventory overselling during concurrent purchases?",
         "Answer: We use row-level pessimistic locking (SELECT FOR UPDATE) inside an atomic transaction. When Transaction 1 queries the stock row, PostgreSQL places an exclusive lock on it. If Transaction 2 arrives concurrently, it must wait until Transaction 1 commits. Transaction 1 decrements stock and commits. Transaction 2 then inspects the updated row, sees insufficient stock, and throws a 422 Unprocessable Entity error. Our database also enforces CHECK (quantity >= 0) as a hard constraint."),

        ("Q2: How do you prevent deadlocks when locking multiple inventory rows?",
         "Answer: Deadlocks occur when concurrent transactions acquire locks in opposing orders. We prevent this by sorting product IDs in ascending order ([...productIds].sort()) before calling lockAndFetchForUpdate. Because every transaction acquires locks in the exact same sequence, circular wait deadlocks are mathematically impossible."),

        ("Q3: Why is payment processed outside the database transaction?",
         "Answer: Database transactions hold row locks and consume connection pool slots. If an external payment gateway takes 3-5 seconds due to network latency, keeping the transaction open would freeze inventory rows and exhaust the connection pool. We use a Two-Phase SAGA: stock is decremented in milliseconds, the lock is released, payment is called outside, and if it fails, a compensating transaction increments the stock back."),

        ("Q4: How does your Idempotency mechanism work?",
         "Answer: The client passes an Idempotency-Key header. Our IdempotencyInterceptor hashes the method, path, and JSON body with SHA-256. If a request arrives with an existing key, we verify the hash. If the hashes match, we immediately replay the stored response with X-Idempotency-Replayed: true, preventing duplicate orders or payments. If the payload differs, we throw a 422 error."),

        ("Q5: How do you enforce Multi-Tenancy and prevent cross-tenant data leaks?",
         "Answer: Multi-tenancy is enforced at three levels: (1) The JWT payload securely carries user.merchantId and user.storeId. (2) StoreAccessGuard validates that the requested store belongs to the user's merchantId and managers/cashiers only access their assigned store. (3) Database queries filter by merchantId and storeId."),

        ("Q6: Why store prices as integers instead of decimals or floats?",
         "Answer: Floating-point arithmetic introduces IEEE 754 precision errors (e.g. 0.1 + 0.2 = 0.30000000000000004). Over thousands of transactions, this causes accounting discrepancies. We store currency in integer minor units (paise/cents, where ₹450.00 = 45000 in a bigint column), guaranteeing exact financial math."),

        ("Q7: How does your Redis caching strategy work?",
         "Answer: We cache product catalog reads (GET /products) in Redis for 5 minutes (TTL = 300,000ms). When an Admin creates, updates, or deletes a product, ProductsService explicitly invalidates the merchant's catalog cache key (products:merchant:<id>). We also cache store existence in StoreAccessGuard for 60 seconds to eliminate redundant database queries."),

        ("Q8: How are passwords secured?",
         "Answer: Passwords travel over TLS/HTTPS and are hashed using bcrypt with a salt cost factor of 10 (1,024 rounds). Passwords are never stored in plain text, never logged, and the passwordHash property is explicitly stripped before returning user entities."),

        ("Q9: What external integrations exist vs what is NOT implemented?",
         "Answer: We implemented an abstract PaymentPort with a MockPaymentProvider for testing success and failure scenarios, and a daily 2:00 AM cron job (@nestjs/schedule) to clean up expired idempotency keys. Email (Nodemailer) and Message Queues (Kafka/BullMQ) are NOT in the codebase; they are part of our future roadmap."),

        ("Q10: What would you improve in Version 2.0?",
         "Answer: (1) Integrate BullMQ or Kafka for asynchronous receipt emails and analytics event streaming. (2) Implement a Redis token blacklist for immediate revocation on user logout. (3) Add Helmet and Throttler modules for edge rate limiting."),
    ]

    for q, a in qa_list:
        story.append(p(f"<b>{q}</b>", 'H2'))
        story.append(p(a, 'Body'))
        story.append(Spacer(1, 2))

    # PAGE BREAK FOR POSTMAN & QUICK REVISION
    story.append(PageBreak())

    # SECTION 7: 7-STEP POSTMAN DEMO GUIDE
    story.append(p("7. Quick 7-Step Postman Demo Guide", 'H1'))
    story.append(p("If the interviewer asks you to demo via Postman or explain your testing workflow, follow these 7 steps:"))
    story.append(p("<b>1. Health Check:</b> <code>GET /api/v1/health</code> -> Returns <code>{ status: 'ok', db: 'ok', redis: 'ok' }</code>.", 'Bullet'))
    story.append(p("<b>2. Owner Login:</b> <code>POST /api/v1/auth/login</code> with <code>owner-a@merchant.com / password123</code>. Copy the returned <code>accessToken</code>.", 'Bullet'))
    story.append(p("<b>3. Create Store:</b> <code>POST /api/v1/stores</code> with Bearer token. Body: <code>{ \"name\": \"Downtown Flagship\", \"address\": \"Indiranagar\" }</code>.", 'Bullet'))
    story.append(p("<b>4. Create Cashier:</b> <code>POST /api/v1/users</code>. Body: <code>{ \"email\": \"cashier@store.com\", \"password\": \"password123\", \"role\": \"CASHIER\", \"storeId\": \"&lt;STORE_ID&gt;\" }</code>.", 'Bullet'))
    story.append(p("<b>5. Set Stock:</b> <code>PUT /api/v1/stores/:id/inventory/:productId</code> with Manager token. Body: <code>{ \"quantity\": 10 }</code>.", 'Bullet'))
    story.append(p("<b>6. Process Sale:</b> <code>POST /api/v1/stores/:id/sales</code> with Cashier token & <code>Idempotency-Key: test-uuid-1</code>. Status: <b>201 Created</b>.", 'Bullet'))
    story.append(p("<b>7. Prove Idempotency:</b> Send the exact same request again. Header shows <code>X-Idempotency-Replayed: true</code> and stock is NOT decremented twice!", 'Bullet'))

    # SECTION 8: 60-SECOND PRE-INTERVIEW REVISION CHECKLIST
    story.append(Spacer(1, 4))
    story.append(p("8. 60-Second Last-Minute Revision Checklist", 'H1'))
    story.append(callout(
        "Read This Right Before You Join the Interview Call:",
        "• <b>Roles:</b> 4 roles. OWNER (4) > ADMIN (3) > MANAGER (2) > CASHIER (1). Evaluated numerically in RolesGuard.<br/>"
        "• <b>Concurrency:</b> SELECT FOR UPDATE + sorted product IDs (deadlock prevention) + CHECK (quantity >= 0).<br/>"
        "• <b>SAGA:</b> Fast DB lock release (< 5ms) -> payment outside -> compensating rollback if payment fails.<br/>"
        "• <b>Idempotency:</b> SHA-256 payload hash + replay cached response with X-Idempotency-Replayed header.<br/>"
        "• <b>Caching:</b> Redis caches product catalog (5 min) with write-through invalidation; store access cached 60s.<br/>"
        "• <b>Truth on Features:</b> PaymentPort is a mock adapter; Email and Kafka/BullMQ are NOT in code (planned for v2).",
        'blue'
    ))

    story.append(Spacer(1, 10))
    story.append(callout(
        "Good Luck!",
        "Take a deep breath. You built an exceptionally clean, well-architected project. Be calm, speak clearly, walk through the story of Ramesh and your concurrency decisions, and you will do great!",
        'green'
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Fast-Track PDF generated: {filename}")

if __name__ == '__main__':
    target = "/Users/gauravmishra/Projects/merchantFolder/POS_Interview_Fast_Track_Crash_Course.pdf"
    build_pdf(target)
