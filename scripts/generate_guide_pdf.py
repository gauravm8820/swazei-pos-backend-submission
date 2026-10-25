#!/usr/bin/env python3
"""
Masterclass Visual PDF Generator for Multi-Tenant POS Backend System
Features: Visual Flowcharts, Role Management, Encryption/Security Mechanics, Postman Testing Guide
Author: Gaurav Mishra
Target: /Users/gauravmishra/Projects/merchantFolder/POS_System_Architecture_and_Interview_Mastery_Guide.pdf
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
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(40, letter[1] - 30, "MULTI-TENANT POS SYSTEM — VISUAL ARCHITECTURE & INTERVIEW GUIDE")
        self.drawRightString(letter[0] - 40, letter[1] - 30, "GAURAV MISHRA | PRE-INTERVIEW CRASH COURSE")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(40, letter[1] - 34, letter[0] - 40, letter[1] - 34)

        # Running Footer
        self.line(40, 36, letter[0] - 40, 36)
        self.setFont("Helvetica", 7.5)
        self.drawString(40, 25, "Confidential — Swazei Tech Senior Backend Submission")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(letter[0] - 40, 25, page_str)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=44,
        bottomMargin=44,
    )

    PRIMARY = colors.HexColor("#0f172a")      # Slate 900
    SECONDARY = colors.HexColor("#1e293b")    # Slate 800
    ACCENT_TEAL = colors.HexColor("#0d9488")  # Teal 600
    ACCENT_BLUE = colors.HexColor("#2563eb")  # Blue 600
    ACCENT_EMERALD = colors.HexColor("#059669")# Emerald 600
    ACCENT_PURPLE = colors.HexColor("#7c3aed")# Purple 600
    BORDER_GRAY = colors.HexColor("#cbd5e1")  # Slate 300
    TEXT_MAIN = colors.HexColor("#334155")    # Slate 700

    styles = {
        'DocTitle': ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=PRIMARY, alignment=1),
        'DocSubtitle': ParagraphStyle('DocSubtitle', fontName='Helvetica', fontSize=10.5, leading=14, textColor=ACCENT_TEAL, alignment=1),
        'CoverMeta': ParagraphStyle('CoverMeta', fontName='Helvetica', fontSize=8.5, leading=12, textColor=TEXT_MAIN, alignment=1),
        'H1': ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=12.5, leading=15, textColor=PRIMARY, spaceBefore=7, spaceAfter=3, keepWithNext=True),
        'H2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9.5, leading=12.5, textColor=ACCENT_TEAL, spaceBefore=5, spaceAfter=2, keepWithNext=True),
        'H3': ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=SECONDARY, spaceBefore=3, spaceAfter=1, keepWithNext=True),
        'Body': ParagraphStyle('Body', fontName='Helvetica', fontSize=8, leading=11, textColor=TEXT_MAIN, spaceAfter=3),
        'BodyBold': ParagraphStyle('BodyBold', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=PRIMARY, spaceAfter=3),
        'Bullet': ParagraphStyle('Bullet', fontName='Helvetica', fontSize=8, leading=11, textColor=TEXT_MAIN, leftIndent=10, firstLineIndent=-7, spaceAfter=2),
        'DiagramText': ParagraphStyle('DiagramText', fontName='Courier', fontSize=6.5, leading=8.5, textColor=colors.HexColor("#0f172a")),
        'BoxText': ParagraphStyle('BoxText', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=colors.HexColor("#1e3a8a")),
        'BoxTitle': ParagraphStyle('BoxTitle', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.HexColor("#1e40af"), spaceAfter=1.5),
        'GreenBoxText': ParagraphStyle('GreenBoxText', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=colors.HexColor("#065f46")),
        'GreenBoxTitle': ParagraphStyle('GreenBoxTitle', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.HexColor("#047857"), spaceAfter=1.5),
        'PurpleBoxText': ParagraphStyle('PurpleBoxText', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=colors.HexColor("#4c1d95")),
        'PurpleBoxTitle': ParagraphStyle('PurpleBoxTitle', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.HexColor("#6d28d9"), spaceAfter=1.5),
        'TableHead': ParagraphStyle('TableHead', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.white),
        'TableCell': ParagraphStyle('TableCell', fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=TEXT_MAIN),
        'TableCellBold': ParagraphStyle('TableCellBold', fontName='Helvetica-Bold', fontSize=6.5, leading=8.5, textColor=PRIMARY),
        'TableCellCode': ParagraphStyle('TableCellCode', fontName='Courier', fontSize=6, leading=8, textColor=colors.HexColor("#0f172a")),
    }

    story = []

    def p(text, style_name='Body'):
        return Paragraph(text, styles[style_name])

    def callout(title, text, kind='blue'):
        if kind == 'green':
            t_style, b_style = 'GreenBoxTitle', 'GreenBoxText'
            bg_col, b_col = colors.HexColor("#f0fdf4"), ACCENT_EMERALD
        elif kind == 'purple':
            t_style, b_style = 'PurpleBoxTitle', 'PurpleBoxText'
            bg_col, b_col = colors.HexColor("#faf5ff"), ACCENT_PURPLE
        else:
            t_style, b_style = 'BoxTitle', 'BoxText'
            bg_col, b_col = colors.HexColor("#f0f9ff"), ACCENT_BLUE

        cell = [
            Paragraph(f"<b>{title}</b>", styles[t_style]),
            Spacer(1, 1),
            Paragraph(text, styles[b_style])
        ]
        t = Table([[cell]], colWidths=[letter[0] - 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_col),
            ('BOX', (0,0), (-1,-1), 0.75, b_col),
            ('TOPPADDING', (0,0), (-1,-1), 3.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    def diagram_box(diagram_str):
        p_diag = Preformatted(diagram_str, styles['DiagramText'])
        t = Table([[p_diag]], colWidths=[letter[0] - 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.75, BORDER_GRAY),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        return t

    # =========================================================================
    # PAGE 1: COVER PAGE & ELEVATOR PITCH
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=3, color=ACCENT_TEAL, spaceBefore=0, spaceAfter=12))
    story.append(p("Multi-Tenant POS Backend — Visual Architecture Guide", 'DocTitle'))
    story.append(Spacer(1, 3))
    story.append(p("Visual Flowcharts, Role Management, Encryption Security & Postman Verification Masterclass", 'DocSubtitle'))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_GRAY, spaceBefore=10, spaceAfter=16))

    meta_table_data = [
        [p("<b>Project:</b> Swazei Tech Senior Backend Submission", 'CoverMeta')],
        [p("<b>Engineered By:</b> Gaurav Mishra (<font color='#2563eb'>gaurav.m8820@gmail.com</font>)", 'CoverMeta')],
        [p("<b>Tech Stack:</b> NestJS 10, TypeScript, PostgreSQL, TypeORM, Redis 7, Docker, Jest", 'CoverMeta')],
        [p("<b>Core Focus:</b> Visual Request Flow, Role Hierarchy (RBAC), Bcrypt & JWT Security, Postman Testing", 'CoverMeta')],
    ]
    t_meta = Table(meta_table_data, colWidths=[letter[0] - 80])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 0.75, BORDER_GRAY),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    story.append(p("1. The 60-Second Spoken Elevator Pitch (Say This in Interview)", 'H1'))
    story.append(callout(
        "\"Tell me about your project and its architecture:\"",
        "\"I engineered a high-concurrency, multi-tenant Point of Sale (POS) backend in NestJS, PostgreSQL, and Redis.<br/><br/>"
        "It solves the 3 most critical challenges in retail software:<br/>"
        "1. <b>Zero Inventory Overselling:</b> Using row-level pessimistic locking (<b>SELECT FOR UPDATE</b>) in TypeORM with <b>ascending product ID sorting</b> to guarantee deadlock immunity, backed by an engine-level database <b>CHECK (quantity >= 0)</b> constraint.<br/>"
        "2. <b>Double-Charge Prevention:</b> A distributed <b>Idempotency Interceptor</b> hashes incoming request payloads using SHA-256 and instantly replays stored receipts on network retries without charging the customer twice.<br/>"
        "3. <b>Multi-Tenant & Role Security:</b> Strict 4-tier Role-Based Access Control (<b>OWNER > ADMIN > MANAGER > CASHIER</b>) enforced via custom NestJS guards, alongside <b>Bcrypt hashing (10 salt rounds)</b> and signed, tamper-proof <b>stateless JWT tokens</b> with dual-token refresh rotation.<br/><br/>"
        "Product catalogs and store authorization lookups are cached in <b>Redis</b> with write-through invalidation, and the entire system is verified through comprehensive Jest concurrency and integration tests.\"",
        'green'
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: COMPLETE REQUEST LIFECYCLE & LANGUAGE/STACK MANAGEMENT
    # =========================================================================
    story.append(p("2. How Languages, Stack & The Request Lifecycle Are Managed", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(p("A. How Languages, Runtime & Types Are Managed in the Codebase", 'H2'))
    story.append(p(
        "• <b>TypeScript & Runtime:</b> The entire project is written in strictly-typed <b>TypeScript (v5.3)</b> running on <b>Node.js (v20+)</b> within the <b>NestJS</b> framework. TypeScript provides compile-time type safety, while DTOs with <code>class-validator</code> decorators provide runtime validation.<br/>"
        "• <b>Internationalization & Currency:</b> All prices and currency representations are managed using standard ISO 4217 currency codes (default <code>'INR'</code>) and integer minor units (paise/cents). UTF-8 encoding is enabled globally across PostgreSQL and HTTP responses to support multi-language product names."
    ))

    story.append(p("B. Visual Diagram: Complete End-to-End Request Journey", 'H2'))

    req_lifecycle_diagram = """
  +-----------------------------------------------------------------------------------------------+
  |                                   CLIENT (Postman / Web POS)                                  |
  | Sends HTTP POST /api/v1/stores/:storeId/sales  |  Headers: Authorization Bearer, Idempotency-Key |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  |                                     1. NESTJS HTTP GATEWAY                                    |
  |  - Global Prefix: /api/v1  |  CORS: Enabled for frontend cross-origin requests                |
  |  - ValidationPipe: whitelist: true, forbidNonWhitelisted: true (Strips malicious extra fields)|
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  |                                    2. SECURITY GUARDS LAYER                                   |
  |  [JwtAuthGuard]       --> Verifies JWT cryptographic signature & decodes user payload         |
  |  [RolesGuard]         --> Checks numeric hierarchy: OWNER(4) > ADMIN(3) > MANAGER(2) > CASHIER(1)
  |  [StoreAccessGuard]   --> Verifies store belongs to tenant & user is assigned (cached in Redis)|
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  |                                 3. IDEMPOTENCY INTERCEPTOR                                    |
  |  - Computes SHA-256 hash of (HTTP method + path + body)                                       |
  |  - If key exists & completed -> REPLAYS cached 201 receipt with header X-Idempotency-Replayed  |
  |  - If new -> marks key as 'isProcessing' and lets request continue                            |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  |                              4. CONTROLLER & SERVICE SAGA ENGINE                              |
  |  SalesController -> SalesService.createSale()                                                 |
  |  [PHASE 1: DB Transaction (<5ms)] --> SELECT FOR UPDATE (Lock stock) -> Decrement stock -> Commit
  |  [PHASE 2: HTTP Gateway Call]    --> Call PaymentPort.charge() OUTSIDE the DB transaction     |
  |  [PHASE 3: Outcome Handling]     --> If Success: Mark PAID | If Failed: Compensate (Restore stock)
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  |                                  5. POSTGRESQL & REDIS STATE                                  |
  |  - PostgreSQL: sales, sale_items (with price snapshots), payments, store_inventory, keys      |
  |  - Redis: Write-through cache invalidation on product catalog (5-min TTL)                    |
  +-----------------------------------------------------------------------------------------------+
"""
    story.append(diagram_box(req_lifecycle_diagram))

    story.append(Spacer(1, 4))
    story.append(callout(
        "Why This Architecture Wins in an Interview:",
        "Every single layer has one clear job: ValidationPipe cleans inputs, Guards enforce security, the Interceptor guarantees network retry safety, the Service manages atomic business transactions, and Repositories handle database persistence. No layer interferes with another.",
        'blue'
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: ROLE MANAGEMENT & RBAC FLOWCHART
    # =========================================================================
    story.append(p("3. How Roles Are Managed & What Is Their Purpose (RBAC)", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(p("Why Do We Need Roles in a Retail System?", 'H2'))
    story.append(p(
        "In a real retail business with 50 stores, you cannot give equal power to every employee. "
        "A 19-year-old cashier at an airport counter should only be able to ring up sales and check prices. "
        "They should <b>never</b> be allowed to delete a store, view corporate profit margins, change product prices, or create new administrator accounts. "
        "Conversely, the company Owner needs unrestricted access across all stores to see total revenue and manage corporate settings."
    ))

    story.append(p("Visual Flowchart: How the Backend Decides Role Authorization", 'H2'))

    rbac_flowchart = """
                       [Incoming Request to an API Endpoint]
                                         |
                                         v
                     [Does Endpoint Have @Roles(...) Decorator?]
                                    /         \\
                                  NO           YES
                                 /               \\
                                v                 v
                      [Allow Access]     [Inspect User's JWT Token]
                                                  |
                                                  v
                                     [Extract user.role from JWT]
                                                  |
                                                  v
                            [Evaluate in RolesGuard: src/common/guards/roles.guard.ts]
                            ROLE_HIERARCHY: SUPER_ADMIN (5) > OWNER (4) > ADMIN (3) > MANAGER (2) > CASHIER (1)
                                                  |
                                                  v
                             Is ROLE_HIERARCHY[user.role] >= Required Level?
                                            /           \\
                                          NO             YES
                                         /                 \\
                                        v                   v
                             [403 FORBIDDEN]        [Is Route Store-Specific?]
                             Access Denied!               /            \\
                                                        NO              YES
                                                       /                  \\
                                                      v                    v
                                                [Allow Request]    [StoreAccessGuard Checks:]
                                                                   1. Does store belong to merchant?
                                                                   2. For MANAGER/CASHIER:
                                                                      Does user.storeId == :storeId?
                                                                            /             \\
                                                                          NO               YES
                                                                         /                   \\
                                                                        v                     v
                                                                 [403 FORBIDDEN]        [Allow Request]
"""
    story.append(diagram_box(rbac_flowchart))

    story.append(Spacer(1, 4))
    story.append(p("The 5 Roles Summary Table (Including Platform Super Admin)", 'H2'))

    roles_summary_data = [
        [p("Role", 'TableHead'), p("Level", 'TableHead'), p("Scope", 'TableHead'), p("Purpose & Allowed Operations", 'TableHead'), p("What is Blocked (403)", 'TableHead')],
        [p("<b>SUPER_ADMIN</b>", 'TableCellBold'), p("5", 'TableCell'), p("Platform", 'TableCell'), p("Platform Vendor Owner: Manage subscription plans (<code>/subscriptions/plans</code>), onboard client companies (<code>POST /merchants</code>), assign/renew subscriptions."), p("Cannot checkout POS without merchant store context.")],
        [p("<b>OWNER</b>", 'TableCellBold'), p("4", 'TableCell'), p("Merchant", 'TableCell'), p("Company Owner: View subscription profile & limits (<code>GET /merchants/me</code>), create stores (subject to plan limits), create staff, view all sales across all stores."), p("Blocked if plan store limit reached; cannot access Tenant B.")],
        [p("<b>ADMIN</b>", 'TableCellBold'), p("3", 'TableCell'), p("Merchant", 'TableCell'), p("Operations Manager: Create new stores (plan limited), create staff (within subscription limits), create & edit products in catalog, view all merchant stores."), p("Cannot deactivate stores or update corporate plan settings.")],
        [p("<b>MANAGER</b>", 'TableCellBold'), p("2", 'TableCell'), p("Store", 'TableCell'), p("Store Supervisor: View assigned store details, update product inventory stock (<code>PUT /inventory/:productId</code>), view store cashiers and sales."), p("Cannot create stores, create users, or access other stores.")],
        [p("<b>CASHIER</b>", 'TableCellBold'), p("1", 'TableCell'), p("Store", 'TableCell'), p("POS Checkout Operator: View product catalog, check stock, process customer sales transactions (<code>POST /sales</code>), print receipts."), p("Cannot adjust stock directly, create users, or access other stores.")],
    ]
    t_roles_sum = Table(roles_summary_data, colWidths=[55, 30, 48, 222, 165])
    t_roles_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_roles_sum)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: ENCRYPTION & SECURITY FOR AUTHENTICATION
    # =========================================================================
    story.append(p("4. Encryption & Security Mechanics for the Auth System", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(p("Why Is Encryption & Hashing Needed? (The Threat Model)", 'H2'))
    story.append(p(
        "1. <b>Never Store Plaintext Passwords:</b> If a hacker or rogue employee dumps the database, plaintext passwords compromise every account. "
        "We use <b>Bcrypt one-way hashing with 10 salt rounds</b>. Even if attackers steal the database, they cannot reverse the hashes.<br/>"
        "2. <b>Why Salt Matters:</b> A random 128-bit salt is generated for each password. Even if two cashiers choose the exact same password (<code>'password123'</code>), their stored hashes look completely different, making rainbow table attacks completely useless.<br/>"
        "3. <b>Why Sign JWTs:</b> Can a clever user tamper with their JWT to change <code>role: 'CASHIER'</code> to <code>role: 'OWNER'</code>? <b>NO!</b> Because the token is signed with a cryptographic secret (<code>JWT_SECRET</code>). If even a single character in the payload is altered, the HMAC-SHA256 signature verification fails and the server rejects it with <b>401 Unauthorized</b>."
    ))

    story.append(p("Visual Diagram: How Password Hashing & JWT Verification Work", 'H2'))

    auth_security_diagram = """
  [USER CREATION / SIGNUP]
  Plaintext Password: "password123"
            |
            v
  [Bcrypt Algorithm: 10 Salt Rounds] ---> Generates Random 128-bit Salt
            |
            v
  One-Way Hash Output: $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
            |
            v  (Stored securely in PostgreSQL 'users' table - CAN NEVER BE REVERSED!)

  ==================================================================================================

  [LOGIN VERIFICATION JOURNEY: POST /api/v1/auth/login]
  Client sends { email, password }
            |
            v
  1. Find user in database by email (checks user.isActive == true)
            |
            v
  2. bcrypt.compare(candidatePassword, storedHash):
     - Extracts the salt from the stored hash
     - Hashes candidate password with the extracted salt
     - Compares hashes in CONSTANT TIME (protects against timing attacks)
            |
            v
  3. If Match -> Generate JWT Tokens:
     +------------------------------------------------------------------------------------------+
     | ACCESS TOKEN (1-Hour Expiry):                                                            |
     | Header:    { "alg": "HS256", "typ": "JWT" }                                              |
     | Payload:   { "sub": userId, "merchantId": uuid, "storeId": uuid, "role": "CASHIER" }     |
     | Signature: HMAC-SHA256(Header + Payload, JWT_SECRET)  <-- Tamper-proof cryptographic seal|
     +------------------------------------------------------------------------------------------+
     | REFRESH TOKEN (7-Day Expiry): Signed with separate JWT_REFRESH_SECRET                    |
     +------------------------------------------------------------------------------------------+
"""
    story.append(diagram_box(auth_security_diagram))

    story.append(Spacer(1, 4))
    story.append(callout(
        "Dual-Token Architecture Explained:",
        "<b>Access Token (1 Hour):</b> Sent in the Authorization header on every API request. Short lifespan limits damage if stolen.<br/>"
        "<b>Refresh Token (7 Days):</b> Stored securely. When the 1-hour access token expires, the client calls <code>POST /auth/refresh</code> to receive a new access token without forcing the user to log in again.",
        'purple'
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: PRACTICAL POSTMAN VERIFICATION GUIDE (TESTING ROLES & SECURITY)
    # =========================================================================
    story.append(p("5. How to Check Roles & Security in Postman (Hands-On Guide)", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(p("The 5 Core Security & Role Tests to Demonstrate in Postman", 'H2'))
    story.append(p(
        "When an interviewer asks you to demonstrate security and RBAC in Postman, run these exact 5 tests to prove your system works:"
    ))

    postman_flowchart = """
  +-----------------------------------------------------------------------------------------------+
  | TEST 1: Check Password Security & Invalid Credentials                                         |
  | Send: POST {{baseUrl}}/auth/login with wrong password                                         |
  | Expect: 401 UNAUTHORIZED {"statusCode": 401, "message": "Invalid credentials"}                |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  | TEST 2: Valid Login & Token Inspection                                                        |
  | Send: POST {{baseUrl}}/auth/login with owner-a@merchant.com / password123                     |
  | Expect: 200 OK with accessToken & refreshToken. Copy accessToken to Postman Bearer Token.     |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  | TEST 3: PROVE RBAC RESTRICTION (Cashier Blocked from Admin Action)                            |
  | 1. Log in as Cashier (cashier-s1@merchant.com). Copy Cashier's accessToken.                   |
  | 2. Try creating a user: POST {{baseUrl}}/users with Cashier Token.                            |
  | Expect: 403 FORBIDDEN {"statusCode": 403, "error": "FORBIDDEN", "message": "Forbidden"}      |
  | ==> PROVES: RolesGuard successfully stopped a Cashier from performing an Admin operation!     |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  | TEST 4: PROVE RBAC PERMISSION (Owner/Admin Allowed)                                           |
  | 1. Switch back to Owner Token (owner-a@merchant.com).                                         |
  | 2. Send: POST {{baseUrl}}/users with { email, password, role: "CASHIER", storeId }            |
  | Expect: 201 CREATED {"data": { "id": "...", "email": "...", "role": "CASHIER" }}              |
  | ==> PROVES: Higher-level role has full permission! Notice passwordHash is NEVER exposed!      |
  +-----------------------------------------------------------------------------------------------+
                                                  |
                                                  v
  +-----------------------------------------------------------------------------------------------+
  | TEST 5: PROVE IDEMPOTENCY (Double-Charge Prevention)                                          |
  | 1. Send: POST {{baseUrl}}/stores/:storeId/sales with Header 'Idempotency-Key: demo-uuid-1'    |
  | Expect: 201 CREATED with receipt invoice. Stock is decremented.                               |
  | 2. Click 'Send' again with identical Idempotency-Key.                                         |
  | Expect: 201 CREATED with Header X-Idempotency-Replayed: true. Stock is NOT decremented twice! |
  +-----------------------------------------------------------------------------------------------+
"""
    story.append(diagram_box(postman_flowchart))

    story.append(Spacer(1, 4))
    story.append(p("Exact Postman JSON Payloads for Quick Copy-Paste", 'H2'))

    payload_table_data = [
        [p("Request", 'TableHead'), p("Method & URL", 'TableHead'), p("Headers", 'TableHead'), p("Sample Request Body (JSON)", 'TableHead')],
        [
            p("<b>Login</b>", 'TableCellBold'),
            p("<code>POST /auth/login</code>", 'TableCellCode'),
            p("<code>Content-Type: application/json</code>", 'TableCellCode'),
            p("<code>{\"email\": \"owner-a@merchant.com\", \"password\": \"password123\"}</code>", 'TableCellCode')
        ],
        [
            p("<b>Create Store</b>", 'TableCellBold'),
            p("<code>POST /stores</code>", 'TableCellCode'),
            p("<code>Authorization: Bearer &lt;OWNER_TOKEN&gt;</code>", 'TableCellCode'),
            p("<code>{\"name\": \"Indiranagar Store\", \"address\": \"100 Ft Rd, Bengaluru\"}</code>", 'TableCellCode')
        ],
        [
            p("<b>Create Cashier</b>", 'TableCellBold'),
            p("<code>POST /users</code>", 'TableCellCode'),
            p("<code>Authorization: Bearer &lt;OWNER_TOKEN&gt;</code>", 'TableCellCode'),
            p("<code>{\"email\": \"cashier@store.com\", \"password\": \"password123\", \"role\": \"CASHIER\", \"storeId\": \"&lt;STORE_UUID&gt;\"}</code>", 'TableCellCode')
        ],
        [
            p("<b>Create Sale</b>", 'TableCellBold'),
            p("<code>POST /stores/:id/sales</code>", 'TableCellCode'),
            p("<code>Authorization: Bearer &lt;CASHIER_TOKEN&gt;<br/>Idempotency-Key: demo-uuid-1</code>", 'TableCellCode'),
            p("<code>{\"items\": [{\"productId\": \"&lt;ID&gt;\", \"quantity\": 2}], \"payment\": {\"method\": \"CASH\", \"amountMinorUnits\": 90000}}</code>", 'TableCellCode')
        ],
    ]
    t_payloads = Table(payload_table_data, colWidths=[65, 95, 140, letter[0] - 80 - 300])
    t_payloads.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_payloads)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: THE 3 CORE CONCURRENCY HIGHLIGHTS & DB DESIGN
    # =========================================================================
    story.append(p("6. Concurrency Engineering & Database Design Highlights", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(p("Highlight A: Pessimistic Row Locking (SELECT FOR UPDATE) & Deadlock Prevention", 'H2'))
    story.append(p(
        "When 10 customers attempt to buy the last item simultaneously, standard ORM updates cause overselling. "
        "We execute <code>lockAndFetchForUpdate()</code> in <code>src/modules/inventory/inventory.repository.ts</code>. "
        "This runs SQL <code>SELECT ... FOR UPDATE</code>, placing an exclusive lock on the stock row until the transaction commits."
    ))

    concurrency_diagram = """
  Customer A Checkout ------------------------------------> [PostgreSQL Engine] <------------------------------------ Customer B Checkout
  SELECT ... FOR UPDATE (Product 1)                                   |               SELECT ... FOR UPDATE (Product 1)
                                                                      |
                   [TRANSACTION A ACQUIRES LOCK FIRST]                 |
                   - Reads Quantity = 1                               |
                   - Decrements Quantity to 0                         |
                   - COMMIT TRANSACTION ----------------------------->|-----> [TRANSACTION B IS UNBLOCKED]
                   (Lock on Product 1 is Released!)                   |       - Reads Updated Quantity = 0
                                                                      |       - Quantity (0) < Requested (1)
                                                                      |       - Throws 422 UNPROCESSABLE ENTITY!
                                                                      |         ("Insufficient inventory!")
  =====================================================================================================================================
  DEADLOCK PREVENTION RULE:
  Always sort product IDs ascending: [...productIds].sort() before requesting locks!
  If Tx1 locks (A then B) and Tx2 locks (B then A), a circular deadlock happens.
  By sorting, every transaction locks resources in identical deterministic order -> ZERO DEADLOCKS!
"""
    story.append(diagram_box(concurrency_diagram))

    story.append(Spacer(1, 4))
    story.append(p("Highlight B: Two-Phase SAGA with Compensation (Payment Outside DB Lock)", 'H2'))
    story.append(p(
        "<b>Senior Dev Rule:</b> Never call third-party HTTP payment APIs (Stripe/Razorpay) inside an open database transaction lock. "
        "If the payment API lags for 4 seconds, database locks stay open and exhaust connection pool slots.<br/>"
        "• <b>Phase 1 (<5ms):</b> Lock stock, validate qty, decrement stock, and commit. <i>Locks are released immediately!</i><br/>"
        "• <b>Phase 2:</b> Call <code>paymentPort.charge()</code> outside the database transaction.<br/>"
        "• <b>Compensating Rollback:</b> If payment fails or times out, a compensating transaction automatically runs <code>incrementBatch()</code> to restore stock to its original count and marks the sale <code>FAILED</code>."
    ))

    story.append(Spacer(1, 4))
    story.append(p("Database Integrity: The 3 Core Schema Guarantees", 'H2'))
    story.append(p("• <b>CHECK (quantity >= 0):</b> Defined on <code>store_inventory</code> table. Even if application code has a bug, PostgreSQL physically rejects any query that would make quantity negative.", 'Bullet'))
    story.append(p("• <b>BigInt Minor Units:</b> All prices and totals are stored as integers (paise/cents, e.g. 45000 = ₹450.00). Eliminates IEEE 754 floating-point rounding errors.", 'Bullet'))
    story.append(p("• <b>Price Snapshots in <code>sale_items</code>:</b> Stores <code>unitPriceSnapshot</code> so future catalog price updates never alter past receipts.", 'Bullet'))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: TOP 10 INTERVIEW QUESTIONS & MODEL ANSWERS
    # =========================================================================
    story.append(p("7. Top 10 Toughest Interview Questions & Spoken Answers", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    qa_list = [
        ("Q1: How do you prevent inventory overselling during concurrent purchases?",
         "Answer: We use row-level pessimistic locking (SELECT FOR UPDATE) inside an atomic transaction. When Transaction 1 queries the stock row, PostgreSQL places an exclusive lock on it. If Transaction 2 arrives concurrently, it must wait until Transaction 1 commits. Transaction 1 decrements stock and commits. Transaction 2 then inspects the updated row, sees insufficient stock, and throws a 422 Unprocessable Entity error. Our database also enforces CHECK (quantity >= 0) as a hard constraint."),

        ("Q2: How do you prevent deadlocks when locking multiple inventory rows?",
         "Answer: Deadlocks occur when concurrent transactions acquire locks in opposing orders. We prevent this by sorting product IDs in ascending order ([...productIds].sort()) before calling lockAndFetchForUpdate. Because every transaction acquires locks in the exact same sequence, circular wait deadlocks are mathematically impossible."),

        ("Q3: Why is payment processed outside the database transaction?",
         "Answer: Database transactions hold row locks and consume connection pool slots. If an external payment gateway takes 3-5 seconds due to network latency, keeping the transaction open would freeze inventory rows and exhaust the connection pool. We use a Two-Phase SAGA: stock is decremented in milliseconds, the lock is released, payment is called outside, and if it fails, a compensating transaction increments the stock back."),

        ("Q4: How does your Idempotency mechanism work?",
         "Answer: The client passes an Idempotency-Key header. Our IdempotencyInterceptor hashes the method, path, and request body using SHA-256. If a request arrives with an existing key, we verify the hash. If the hashes match, we immediately replay the stored response with X-Idempotency-Replayed: true, preventing duplicate orders or payments. If the payload differs, we throw a 422 error."),

        ("Q5: How do you enforce Multi-Tenancy and prevent cross-tenant data leaks?",
         "Answer: Multi-tenancy is enforced at three levels: (1) The JWT payload securely carries user.merchantId and user.storeId. (2) StoreAccessGuard validates that the requested store belongs to the user's merchant and managers/cashiers only access their assigned store. (3) Database queries filter by merchantId and storeId."),

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
        story.append(Spacer(1, 1))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: PRE-INTERVIEW REVISION & REALITY CHECK
    # =========================================================================
    story.append(p("8. Last-Minute Revision Checklist & Reality Check", 'H1'))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_TEAL, spaceBefore=1, spaceAfter=5))

    story.append(callout(
        "Reality Check: What is NOT in the Codebase (Do Not Claim These in Interview):",
        "• <b>Email Transporter (Nodemailer/SendGrid):</b> ❌ NOT in codebase. Passwords/users are managed directly by Admins.<br/>"
        "• <b>Message Brokers (Kafka/BullMQ):</b> ❌ NOT in codebase. Background work uses @nestjs/schedule cron jobs.<br/>"
        "• <b>Public Self-Registration (/auth/register):</b> ❌ NOT in codebase. POS users are provisioned by merchant Admins.<br/>"
        "• <b>Token Revocation / Blacklist on Logout:</b> ❌ NOT in codebase. Stateless JWTs expire automatically after 1 hour.",
        'purple'
    ))

    story.append(Spacer(1, 5))
    story.append(p("60-Second Revision Checklist (Review 5 Minutes Before Calling):", 'H2'))
    story.append(p("1. <b>Roles:</b> 4 roles. OWNER (4) > ADMIN (3) > MANAGER (2) > CASHIER (1). Evaluated numerically in <code>RolesGuard</code>.", 'Bullet'))
    story.append(p("2. <b>Concurrency:</b> <code>SELECT FOR UPDATE</code> in TypeORM + sorted product IDs (deadlock prevention) + <code>CHECK quantity >= 0</code>.", 'Bullet'))
    story.append(p("3. <b>SAGA:</b> Fast DB lock release (< 5ms) -> payment outside -> compensating rollback restores stock if payment fails.", 'Bullet'))
    story.append(p("4. <b>Idempotency:</b> SHA-256 payload hash + replay cached response with <code>X-Idempotency-Replayed: true</code> header.", 'Bullet'))
    story.append(p("5. <b>Caching:</b> Redis caches product catalog (5 min) with write-through invalidation; store access cached 60s.", 'Bullet'))
    story.append(p("6. <b>Password & Token Security:</b> Bcrypt with 10 salt rounds + HMAC-SHA256 signed JWT with 1h access / 7d refresh tokens.", 'Bullet'))
    story.append(p("7. <b>Postman Ready:</b> All passwords are <code>password123</code>. Demo accounts: <code>owner-a@merchant.com</code>, <code>cashier-s1@merchant.com</code>.", 'Bullet'))

    story.append(Spacer(1, 10))
    story.append(callout(
        "You Are 100% Prepared!",
        "Take a deep breath and smile. You understand the architecture, the concurrency locking, the role hierarchy, the encryption, and the Postman flow better than almost any candidate. Walk the interviewer through the diagrams, explain your engineering trade-offs, and you will do great!",
        'green'
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Visual Masterclass PDF successfully generated at: {filename}")

if __name__ == '__main__':
    target = "/Users/gauravmishra/Projects/merchantFolder/POS_System_Architecture_and_Interview_Mastery_Guide.pdf"
    build_pdf(target)
