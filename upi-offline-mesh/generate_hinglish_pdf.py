import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284c7'),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyHinglish',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletHinglish',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=15,
        spaceAfter=4
    )

    code_box_style = ParagraphStyle(
        'CodeBox',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Title
    story.append(Paragraph("UPI Offline Mesh Network & Settlement System", title_style))
    story.append(Paragraph("Complete Hinglish Reference Guide & Complete Discussion Notes", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=12))

    # Section 1
    story.append(Paragraph("1. System Kya Hai Aur Kaise Kaam Karta Hai? (From Zero)", h1_style))
    story.append(Paragraph(
        "<b>Problem Statement:</b> India me normal UPI payments ke liye active 4G/5G/Wi-Fi connection chahiye hota hai. "
        "Basement parking, underground metro, crowded stadiums, hilly areas, ya natural disaster me cellular network fail ho jata hai.", body_style
    ))
    story.append(Paragraph(
        "<b>Solution:</b> Offline Mesh System payments ko sender ke phone par offline sign aur encrypt karta hai. "
        "Phir Bluetooth Low Energy (BLE) Mesh Network ke zariye packet hop-by-hop pass hota hai jab tak kisi phone ko internet na mil jaye.", body_style
    ))

    story.append(Paragraph("Step-by-Step Workflow:", h2_style))
    story.append(Paragraph("<b>Step 1: Offline Payment Create Karna:</b> Alice ₹500 ka payment instruction banati hai. Application ek random 256-bit AES key generate karta hai, JSON payload ko AES-256-GCM se encrypt karta hai, aur AES key ko Bank ki RSA-2048 Public Key se encrypt karta hai (Hybrid Encryption). Intermediate phones sensitive data nahi dekh sakte.", bullet_style))
    story.append(Paragraph("<b>Step 2: Mesh Propagation (BLE Hopping):</b> Packet Bluetooth se nearby phones ko pass hota hai. Har hop par TTL (Time To Live) 1 se kam hota hai (e.g. 5 to 4). TTL 0 hone par packet stop ho jata hai.", bullet_style))
    story.append(Paragraph("<b>Step 3: Bridge Node Connection:</b> Koi ek stranger ya bridge phone jab internet zone (4G/Wi-Fi) me aata hai, toh background me packet <code>POST /api/bridge/ingest</code> par upload ho jata hai.", bullet_style))
    story.append(Paragraph("<b>Step 4: Server Security & Settlement:</b> Server SHA-256 hash nikal kar Redis <code>SET NX EX</code> atomic gate se duplicate drop check karta hai. RSA private key se AES key decrypt karke AES-GCM tag verification (tamper check) aur timestamp freshness check karta hai. Settlement me Alice ₹500 debit aur Bob ₹500 credit hota hai.", bullet_style))

    story.append(Spacer(1, 8))

    # Section 2
    story.append(Paragraph("2. Real-Life Use Cases", h1_style))
    story.append(Paragraph("• <b>Underground Parking & Metros:</b> Basement parking charges ya metro kiosk payment jahan network 0 hota hai.", bullet_style))
    story.append(Paragraph("• <b>Crowded Concerts & Stadiums:</b> 50,000 log ek jagah hone par jab mobile towers jam ho jate hain.", bullet_style))
    story.append(Paragraph("• <b>Remote Villages & Hilly Areas:</b> Mountain trekking ya rural areas jahan cellular connectivity nahi hoti.", bullet_style))
    story.append(Paragraph("• <b>Natural Disasters:</b> Earthquake ya Flood me jab cell towers crash ho jate hain.", bullet_style))

    story.append(Spacer(1, 8))

    # Section 3
    story.append(Paragraph("3. Real Life Me Apply Hoga Ya Nahi? (Production Reality Check)", h1_style))
    story.append(Paragraph(
        "<b>Code Level (YES):</b> Hybrid RSA+AES Cryptography, Redis SET-NX Idempotency, Mesh TTL Gossip, aur Database Transactions 100% production-standard hain.", body_style
    ))
    story.append(Paragraph("Real commercial banking launch ke liye 4 external requirements chahiye hongi:", h2_style))
    story.append(Paragraph("1. <b>NPCI & RBI Approval:</b> Offline wallet risk limits (e.g., ₹200-₹500 max per offline transaction).", bullet_style))
    story.append(Paragraph("2. <b>Hardware Security (TEE / Secure Enclave):</b> Keys phone ke ARM TrustZone / Hardware Chip me store hongi.", bullet_style))
    story.append(Paragraph("3. <b>Mobile OS BLE Background Scanning:</b> iOS aur Android background BLE permissions handling.", bullet_style))
    story.append(Paragraph("4. <b>Offline Wallet Reserve:</b> Account se pehle se ₹2,000 reserve/lock rakhna (NPCI UPI Lite model).", bullet_style))

    story.append(Spacer(1, 8))

    # Section 4
    story.append(Paragraph("4. Project Resume & Placement Value", h1_style))
    story.append(Paragraph(
        "Yeh project ordinary resume level ka nahi, balki <b>TOP 1% S-TIER (High-Impact) RESUME PROJECT</b> hai for Backend, Full-Stack, FinTech, and Systems Engineer roles.", body_style
    ))

    resume_text = (
        "<b>UPI Offline Mesh — Cryptographic Settlement & BLE Mesh Simulator</b> | MERN, Redis, Docker, Cryptography<br/>"
        "• Designed an offline UPI payment settlement engine using RSA-2048-OAEP and AES-256-GCM hybrid encryption.<br/>"
        "• Built a multi-hop Bluetooth Low Energy (BLE) virtual mesh simulator with TTL hop decay.<br/>"
        "• Engineered a zero-race-condition idempotency layer using atomic Redis SET NX EX keys on SHA-256 digests.<br/>"
        "• Developed an ACID-compliant MongoDB transactional settlement engine and Socket.IO real-time dashboard.<br/>"
        "• Containerized monorepo with Docker Compose and achieved 100% pass rate across Jest test suites."
    )
    
    t = Table([[Paragraph(resume_text, code_box_style)]], colWidths=[520])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)

    story.append(Spacer(1, 8))

    # Section 5
    story.append(Paragraph("5. Interactive UI Dashboard User Guide (http://localhost:5173)", h1_style))
    story.append(Paragraph("• <b>Inject Payment:</b> Alice (₹5,000) ➔ Bob (₹1,000) ₹500 ka packet banakar phone-alice par hold karta hai.", bullet_style))
    story.append(Paragraph("• <b>Run Gossip Round:</b> BLE packet nearby phones ko pass hota hai aur TTL decay hota hai.", bullet_style))
    story.append(Paragraph("• <b>Flush Bridge Node:</b> 4G bridge node packet backend ko bhejta hai. Alice ₹4,500 aur Bob ₹1,500 ho jata hai.", bullet_style))
    story.append(Paragraph("• <b>Tamper Ciphertext Demo:</b> Ciphertext ka 1 byte modify karke AES-GCM tag failure verify karta hai (INVALID).", bullet_style))
    story.append(Paragraph("• <b>Replay Attack Demo:</b> Identical packet dubara bhejne par Redis idempotency drop karta hai (DUPLICATE_DROPPED).", bullet_style))
    story.append(Paragraph("• <b>Simulate 3 Concurrent Bridges:</b> 3 simultaneous POST requests me exactly 1 SETTLED aur 2 DUPLICATE_DROPPED hote hain.", bullet_style))

    story.append(Spacer(1, 8))

    # Section 6
    story.append(Paragraph("6. Can it be a Website for Real Offline Payments? (PWA Roadmap)", h1_style))
    story.append(Paragraph(
        "<b>YES!</b> Native App ke bina sirf Website (PWA) se bhi Real Offline Payments possible hain using modern Web APIs:", body_style
    ))
    story.append(Paragraph("• <b>PWA & Service Workers:</b> Airplane Mode me bhi website browser me open hogi.", bullet_style))
    story.append(Paragraph("• <b>Web Crypto API (<code>window.crypto.subtle</code>):</b> Browser ke andar RSA-2048 + AES-256-GCM hardware encryption.", bullet_style))
    story.append(Paragraph("• <b>Web Bluetooth API (<code>navigator.bluetooth</code>):</b> Chrome browser paas ke Bluetooth devices se offline connect kar sakta hai.", bullet_style))
    story.append(Paragraph("• <b>Service Worker Background Sync:</b> Net aate hi background me Razorpay / Cashfree / Bank API Call execution.", bullet_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceAfter=8))
    story.append(Paragraph("Generated by Antigravity AI | Personal Reference Document", ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#64748b'))))

    doc.build(story)
    print(f"PDF successfully generated: {filename}")

if __name__ == '__main__':
    pdf_path = os.path.abspath("UPI_Offline_Mesh_Hinglish_Reference_Guide.pdf")
    build_pdf(pdf_path)
