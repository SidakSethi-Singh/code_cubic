DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdgeMind Fleet Hub &middot; Edge-to-Cloud Sync Engine</title>
  <meta name="description" content="Operational Dashboard and Curation Interface for EdgeMind Fleet Hub distributed IoT edge nodes.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 24, 38, 0.72);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover: rgba(28, 38, 60, 0.85);
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-sub: #64748b;
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --indigo: #6366f1;
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --amber: #f59e0b;
      --amber-glow: rgba(245, 158, 11, 0.2);
      --rose: #f43f5e;
      --rose-glow: rgba(244, 63, 94, 0.2);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-heading: 'Outfit', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --shadow-card: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 50% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
        linear-gradient(180deg, #090d16 0%, #06090f 100%);
      background-attachment: fixed;
      color: var(--text-main);
      font-family: var(--font-body);
      min-height: 100vh;
      line-height: 1.5;
      overflow-x: hidden;
    }

    /* Ambient top glow bar */
    .top-glow-line {
      height: 3px;
      width: 100%;
      background: linear-gradient(90deg, #38bdf8, #6366f1, #10b981, #f59e0b, #38bdf8);
      background-size: 300% 100%;
      animation: gradientFlow 8s linear infinite;
    }

    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Layout */
    .container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }

    /* Navigation */
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 30px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-cube {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #0284c7, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-badge {
      font-size: 0.72rem;
      font-family: var(--font-mono);
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .brand-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Status Pill */
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      padding: 6px 14px;
      border-radius: 999px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      outline: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
    }
    .btn-primary:hover {
      box-shadow: 0 6px 20px rgba(14, 165, 233, 0.55);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--card-border);
      color: var(--text-main);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .btn-curate {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .btn-curate:hover {
      box-shadow: 0 4px 15px var(--emerald-glow);
      transform: translateY(-1px);
    }

    .btn-swagger {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
      color: #a5b4fc;
    }
    .btn-swagger:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: #818cf8;
      color: #ffffff;
    }

    .btn-sm {
      padding: 4px 10px;
      font-size: 0.78rem;
      border-radius: 6px;
    }

    /* KPI Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-card);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.18);
    }

    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-gradient, linear-gradient(90deg, transparent, #38bdf8, transparent));
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .stat-subtext {
      font-size: 0.76rem;
      color: var(--text-sub);
      margin-top: 4px;
    }

    /* Tab Controls */
    .tab-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 22px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-body);
      font-size: 0.94rem;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      cursor: pointer;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.02);
    }

    .tab-btn.active {
      color: var(--primary);
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--primary);
      border-radius: 3px 3px 0 0;
      box-shadow: 0 0 12px var(--primary);
    }

    .tab-badge {
      font-size: 0.72rem;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      font-family: var(--font-mono);
    }

    .tab-btn.active .tab-badge {
      background: rgba(56, 189, 248, 0.2);
      color: var(--primary);
    }

    /* Content Panels */
    .tab-panel {
      display: none;
      animation: fadeIn 0.25s ease;
    }

    .tab-panel.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Card Panels */
    .panel-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: rgba(255, 255, 255, 0.01);
    }

    .panel-title {
      font-family: var(--font-heading);
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
      background: rgba(0, 0, 0, 0.25);
      padding: 3px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--card-border);
    }

    .filter-pill {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-pill:hover {
      color: var(--text-main);
    }

    .filter-pill.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    th {
      padding: 12px 18px;
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--card-border);
      background: rgba(0, 0, 0, 0.2);
    }

    td {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .mono-chip {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 7px;
      border-radius: 4px;
      color: #e2e8f0;
      display: inline-block;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      font-family: var(--font-mono);
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-pending {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }

    .badge-approved {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }

    .badge-rejected {
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fb7185;
    }

    .action-group {
      display: flex;
      gap: 6px;
    }

    .btn-approve {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .btn-approve:hover {
      background: #10b981;
      color: #fff;
    }

    .btn-reject {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }
    .btn-reject:hover {
      background: #f43f5e;
      color: #fff;
    }

    /* Device Cards Grid */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 20px;
    }

    .device-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: var(--shadow-card);
    }

    .device-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
    }

    .device-title {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .device-stat-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .mini-stat {
      background: rgba(0, 0, 0, 0.25);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .mini-stat-label {
      font-size: 0.72rem;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mini-stat-num {
      font-size: 1.3rem;
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--text-main);
    }

    /* Memory push form */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    input, textarea, select {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: var(--text-main);
      font-family: inherit;
      font-size: 0.88rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input:focus, textarea:focus, select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    /* Toast Notification */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      transform: translateY(120%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-size: 0.88rem;
      max-width: 380px;
    }

    #toast.show {
      transform: translateY(0);
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-sub);
    }

    .empty-icon {
      font-size: 2.2rem;
      margin-bottom: 10px;
      opacity: 0.5;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 520px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      transform: scale(0.95);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-overlay.active .modal-box {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .modal-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.3rem;
      line-height: 1;
    }

    .modal-close:hover {
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="top-glow-line"></div>

  <div class="container">
    <!-- Header -->
    <header>
      <div class="brand-section">
        <div class="logo-cube">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div>
          <div class="brand-title">
            EdgeMind Fleet Hub
            <span class="brand-badge">Sync v1.0</span>
          </div>
          <div class="brand-subtitle">Distributed IoT edge memories &middot; Privacy guardrails &middot; Curator gateway</div>
        </div>
      </div>

      <div class="nav-actions">
        <div class="status-indicator" id="hubStatusBadge">
          <span class="pulse-dot"></span>
          <span>ONLINE :8765</span>
        </div>
        <button class="btn btn-outline" id="btnRefresh" onclick="refreshAll()" title="Refresh Dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary" id="btnOpenPushModal" onclick="openPushModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Push Memory
        </button>
        <button class="btn btn-curate" id="btnAutoCurate" onclick="runAutoCurate()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Auto Curate
        </button>
        <a href="/docs" target="_blank" class="btn btn-swagger" id="btnSwaggerLink" title="Interactive FastAPI Swagger UI">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Swagger Docs
        </a>
      </div>
    </header>

    <!-- KPI Metrics -->
    <div class="stats-grid">
      <div class="stat-card" style="--accent-gradient: linear-gradient(90deg, transparent, #38bdf8, transparent);">
        <div class="stat-header">
          <span>Fleet Ingested</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
        </div>
        <div class="stat-value" id="statTotalInbox">0</div>
        <div class="stat-subtext">Cumulative submissions from edge nodes</div>
      </div>

      <div class="stat-card" style="--accent-gradient: linear-gradient(90deg, transparent, #f59e0b, transparent);">
        <div class="stat-header">
          <span>Pending Review</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-value" id="statPending" style="color: #fbbf24;">0</div>
        <div class="stat-subtext">Awaiting manual or rule curation</div>
      </div>

      <div class="stat-card" style="--accent-gradient: linear-gradient(90deg, transparent, #10b981, transparent);">
        <div class="stat-header">
          <span>Curated Knowledge</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-value" id="statKnowledge" style="color: #34d399;">0</div>
        <div class="stat-subtext">Approved and available for fleet pull</div>
      </div>

      <div class="stat-card" style="--accent-gradient: linear-gradient(90deg, transparent, #6366f1, transparent);">
        <div class="stat-header">
          <span>Fleet Version</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
        </div>
        <div class="stat-value" id="statVersion" style="color: #a5b4fc;">v0</div>
        <div class="stat-subtext">Latest global monotonic version</div>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="tab-nav">
      <button class="tab-btn active" onclick="switchTab('inbox')" id="tabBtnInbox">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        Fleet Inbox &amp; Curator
        <span class="tab-badge" id="tabBadgeInbox">0</span>
      </button>

      <button class="tab-btn" onclick="switchTab('knowledge')" id="tabBtnKnowledge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        Verified Fleet Knowledge
        <span class="tab-badge" id="tabBadgeKnowledge">0</span>
      </button>

      <button class="tab-btn" onclick="switchTab('devices')" id="tabBtnDevices">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        Edge Nodes (Device A / B)
      </button>

      <button class="tab-btn" onclick="switchTab('simulator')" id="tabBtnSimulator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Pipeline Simulator
      </button>
    </div>

    <!-- PANEL 1: INBOX & CURATOR -->
    <div class="tab-panel active" id="panelInbox">
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
            Edge Ingestion Queue
          </div>
          <div class="filter-pills">
            <button class="filter-pill active" onclick="setInboxFilter('all', this)">All</button>
            <button class="filter-pill" onclick="setInboxFilter('pending', this)">Pending</button>
            <button class="filter-pill" onclick="setInboxFilter('approved', this)">Approved</button>
            <button class="filter-pill" onclick="setInboxFilter('rejected', this)">Rejected</button>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">ID</th>
                <th style="width: 110px;">Device</th>
                <th style="width: 140px;">Memory ID</th>
                <th>Content &amp; Submission Note</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 160px;">Curator Action / Note</th>
              </tr>
            </thead>
            <tbody id="inboxTableBody">
              <tr>
                <td colspan="6" class="empty-state">Loading inbox items...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PANEL 2: FLEET KNOWLEDGE -->
    <div class="tab-panel" id="panelKnowledge">
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            Curated Global Knowledge Base
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Available to all nodes via <code class="mono-chip">GET /pull?since={ver}</code>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">Version</th>
                <th style="width: 110px;">Source Node</th>
                <th style="width: 140px;">Original Memory</th>
                <th>Verified Fleet Solution</th>
                <th style="width: 170px;">Curated At</th>
              </tr>
            </thead>
            <tbody id="knowledgeTableBody">
              <tr>
                <td colspan="5" class="empty-state">No knowledge curated yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PANEL 3: EDGE NODES -->
    <div class="tab-panel" id="panelDevices">
      <div class="devices-grid">
        <!-- Device A -->
        <div class="device-card" id="cardDeviceA">
          <div class="device-head">
            <div class="device-title">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#38bdf8;"></span>
              Device A (Diagnostic Node)
            </div>
            <span class="mono-chip">Node ID: device-A</span>
          </div>

          <div class="device-stat-bar">
            <div class="mini-stat">
              <div class="mini-stat-label">Outbox Staged</div>
              <div class="mini-stat-num" id="devAOutbox">0</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-label">Learned Knowledge</div>
              <div class="mini-stat-num" id="devALearned">0</div>
            </div>
          </div>

          <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
            <p><strong>Local Policy Rules:</strong></p>
            <ul style="margin-left: 18px; margin-top: 4px;">
              <li>🔒 PII (Phone/Email) is kept strictly local &mdash; never sent to hub.</li>
              <li>📦 Oversized sensor dumps held on device.</li>
              <li>🚀 Verified mechanical fixes enqueued for cloud sharing.</li>
            </ul>
          </div>
        </div>

        <!-- Device B -->
        <div class="device-card" id="cardDeviceB">
          <div class="device-head">
            <div class="device-title">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981;"></span>
              Device B (Field Worker Node)
            </div>
            <span class="mono-chip">Node ID: device-B</span>
          </div>

          <div class="device-stat-bar">
            <div class="mini-stat">
              <div class="mini-stat-label">Outbox Staged</div>
              <div class="mini-stat-num" id="devBOutbox">0</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-label">Learned Knowledge</div>
              <div class="mini-stat-num" id="devBLearned">0</div>
            </div>
          </div>

          <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
            <p><strong>Pull Mechanics:</strong></p>
            <ul style="margin-left: 18px; margin-top: 4px;">
              <li>📥 Automatically pulls curated knowledge versions beyond its cursor.</li>
              <li>🛡️ Idempotent cursor tracking prevents duplicate consumption.</li>
              <li>🚫 Source devices never re-pull their own authored fixes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL 4: SIMULATOR -->
    <div class="tab-panel" id="panelSimulator">
      <div class="panel-card" style="max-width: 800px; margin: 0 auto;">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Interactive Full-Sync Simulation
          </div>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
            Trigger the full lifecycle demonstration: Device A records offline notes (filtering PII and telemetry) &rarr; reconnects and drains outbox to Hub &rarr; rule-based curator runs &rarr; Device B pulls verified knowledge.
          </p>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;">
            <button class="btn btn-primary" id="btnRunSyncDemo" onclick="triggerSimulation()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Execute Full Sync Pipeline
            </button>
            <button class="btn btn-outline" onclick="pushSampleBoltsFix()">
              ⚡ Push M8 Torque Fix
            </button>
            <button class="btn btn-outline" onclick="pushSampleDuplicateFix()">
              ⚠️ Push Duplicate Fix (Test Curator)
            </button>
          </div>

          <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 14px; font-family: var(--font-mono); font-size: 0.8rem; min-height: 120px; max-height: 260px; overflow-y: auto;" id="simConsole">
            <span style="color: var(--text-sub);">[Console ready. Click a simulation action above to observe the log stream.]</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Push Memory Modal -->
  <div class="modal-overlay" id="pushModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">Push Edge Memory to Hub</div>
        <button class="modal-close" onclick="closePushModal()">&times;</button>
      </div>
      <form onsubmit="submitPushMemory(event)">
        <div class="form-grid">
          <div class="form-group">
            <label for="inputDeviceId">Source Device ID</label>
            <input type="text" id="inputDeviceId" required value="device-A">
          </div>
          <div class="form-group">
            <label for="inputMemId">Memory ID</label>
            <input type="text" id="inputMemId" required value="mem_fix_005">
          </div>
          <div class="form-group full">
            <label for="inputText">Knowledge / Observation Content</label>
            <textarea id="inputText" rows="3" required placeholder="e.g. Inspect hydraulic valve pressure at 120 bar after 500 operating hours."></textarea>
          </div>
          <div class="form-group full">
            <label for="inputReason">Local Decision / Policy Rationale</label>
            <input type="text" id="inputReason" placeholder="e.g. High authority technical fix, no PII.">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
          <button type="button" class="btn btn-outline" onclick="closePushModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btnSubmitPush">Push to Hub</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast">
    <span id="toastIcon">ℹ️</span>
    <span id="toastMsg">Notification message</span>
  </div>

  <script>
    let currentFilter = 'all';
    let allInboxItems = [];

    // Switch Dashboard Tabs
    function switchTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      if (tabName === 'inbox') {
        document.getElementById('tabBtnInbox').classList.add('active');
        document.getElementById('panelInbox').classList.add('active');
      } else if (tabName === 'knowledge') {
        document.getElementById('tabBtnKnowledge').classList.add('active');
        document.getElementById('panelKnowledge').classList.add('active');
      } else if (tabName === 'devices') {
        document.getElementById('tabBtnDevices').classList.add('active');
        document.getElementById('panelDevices').classList.add('active');
      } else if (tabName === 'simulator') {
        document.getElementById('tabBtnSimulator').classList.add('active');
        document.getElementById('panelSimulator').classList.add('active');
      }
    }

    // Toast Messenger
    function showToast(message, type = 'info') {
      const toast = document.getElementById('toast');
      const msg = document.getElementById('toastMsg');
      const icon = document.getElementById('toastIcon');
      msg.textContent = message;
      icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // Modal Control
    function openPushModal() {
      document.getElementById('inputMemId').value = 'mem_fix_' + Math.floor(Math.random() * 899 + 100);
      document.getElementById('pushModal').classList.add('active');
    }

    function closePushModal() {
      document.getElementById('pushModal').classList.remove('active');
    }

    // Filter Inbox
    function setInboxFilter(filter, el) {
      currentFilter = filter;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderInbox();
    }

    // Fetch Stats
    async function loadStats() {
      try {
        const res = await fetch('/stats');
        if (!res.ok) return;
        const d = await res.json();
        document.getElementById('statTotalInbox').textContent = d.total_inbox;
        document.getElementById('statPending').textContent = d.pending;
        document.getElementById('statKnowledge').textContent = d.knowledge_count;
        document.getElementById('statVersion').textContent = 'v' + d.latest_version;
        document.getElementById('tabBadgeInbox').textContent = d.total_inbox;
        document.getElementById('tabBadgeKnowledge').textContent = d.knowledge_count;
      } catch (err) {
        console.error("Stats load error:", err);
      }
    }

    // Fetch Inbox Items
    async function loadInbox() {
      try {
        const res = await fetch('/inbox?status=all');
        if (!res.ok) return;
        const data = await res.json();
        allInboxItems = data.items || [];
        renderInbox();
      } catch (err) {
        console.error("Inbox load error:", err);
      }
    }

    function renderInbox() {
      const tbody = document.getElementById('inboxTableBody');
      const items = currentFilter === 'all' 
        ? allInboxItems 
        : allInboxItems.filter(i => i.status === currentFilter);

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">
          <div class="empty-icon">📭</div>
          <div>No inbox items found for filter <strong>${currentFilter}</strong>.</div>
        </td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(item => {
        let badgeClass = 'badge-pending';
        if (item.status === 'approved') badgeClass = 'badge-approved';
        if (item.status === 'rejected') badgeClass = 'badge-rejected';

        let actionHtml = '';
        if (item.status === 'pending') {
          actionHtml = `
            <div class="action-group">
              <button class="btn btn-sm btn-approve" onclick="curateItem(${item.id}, 'approve')">Approve</button>
              <button class="btn btn-sm btn-reject" onclick="curateItem(${item.id}, 'reject')">Reject</button>
            </div>
          `;
        } else {
          actionHtml = `<span style="font-size:0.78rem; color:var(--text-sub);">${item.curator_note || item.status}</span>`;
        }

        return `
          <tr>
            <td><span class="mono-chip">#${item.id}</span></td>
            <td><span class="mono-chip" style="color: #38bdf8;">${escapeHtml(item.device_id)}</span></td>
            <td><span class="mono-chip">${escapeHtml(item.mem_id)}</span></td>
            <td>
              <div style="font-weight: 500; margin-bottom: 2px;">${escapeHtml(item.text)}</div>
              ${item.reason ? `<div style="font-size: 0.76rem; color: var(--text-sub); font-style: italic;">Reason: ${escapeHtml(item.reason)}</div>` : ''}
            </td>
            <td>
              <span class="status-badge ${badgeClass}">${item.status}</span>
            </td>
            <td>${actionHtml}</td>
          </tr>
        `;
      }).join('');
    }

    // Fetch Knowledge
    async function loadKnowledge() {
      try {
        const res = await fetch('/pull?since=0');
        if (!res.ok) return;
        const data = await res.json();
        const items = data.items || [];
        const tbody = document.getElementById('knowledgeTableBody');

        if (items.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
            <div class="empty-icon">📚</div>
            <div>No verified fleet knowledge yet. Approve items in the inbox to populate knowledge.</div>
          </td></tr>`;
          return;
        }

        tbody.innerHTML = items.map(k => {
          const dt = new Date(k.curated_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return `
            <tr>
              <td><span class="mono-chip" style="color:#a5b4fc; font-weight:700;">v${k.version}</span></td>
              <td><span class="mono-chip" style="color:#38bdf8;">${escapeHtml(k.source_device)}</span></td>
              <td><span class="mono-chip">${escapeHtml(k.mem_id)}</span></td>
              <td style="font-weight: 500;">${escapeHtml(k.text)}</td>
              <td style="font-size: 0.8rem; color: var(--text-sub);">${dt}</td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        console.error("Knowledge load error:", err);
      }
    }

    // Fetch Devices
    async function loadDevices() {
      try {
        const res = await fetch('/devices');
        if (!res.ok) return;
        const data = await res.json();
        if (data['device-A']) {
          document.getElementById('devAOutbox').textContent = data['device-A'].outbox_count ?? 0;
          document.getElementById('devALearned').textContent = data['device-A'].learned_count ?? 0;
        }
        if (data['device-B']) {
          document.getElementById('devBOutbox').textContent = data['device-B'].outbox_count ?? 0;
          document.getElementById('devBLearned').textContent = data['device-B'].learned_count ?? 0;
        }
      } catch (err) {
        console.error("Devices load error:", err);
      }
    }

    // Curate Item
    async function curateItem(inboxId, decision) {
      try {
        const note = prompt(`Enter note for ${decision} (optional):`, decision === 'approve' ? 'Manual approval' : 'Rejected by curator');
        if (note === null) return; // user cancelled

        const res = await fetch(`/curate/${inboxId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, note: note || undefined })
        });
        const out = await res.json();
        showToast(`Item #${inboxId} ${out.status}`, 'success');
        refreshAll();
      } catch (err) {
        showToast(`Error curating: ${err.message}`, 'error');
      }
    }

    // Run Auto Curate
    async function runAutoCurate() {
      try {
        const res = await fetch('/curate-auto', { method: 'POST' });
        const out = await res.json();
        showToast(`Auto Curate: ${out.approved} approved, ${out.rejected} rejected`, 'success');
        logConsole(`🤖 Curate-Auto executed: Approved: ${out.approved}, Rejected: ${out.rejected}`);
        refreshAll();
      } catch (err) {
        showToast(`Auto-curate failed: ${err.message}`, 'error');
      }
    }

    // Submit Push Memory
    async function submitPushMemory(e) {
      e.preventDefault();
      const device_id = document.getElementById('inputDeviceId').value.trim();
      const mem_id = document.getElementById('inputMemId').value.trim();
      const text = document.getElementById('inputText').value.trim();
      const reason = document.getElementById('inputReason').value.trim();
      const idem_key = 'web_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      try {
        const res = await fetch('/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idem_key, device_id, mem_id, text, reason })
        });
        const out = await res.json();
        if (out.duplicate) {
          showToast(`Duplicate item ignored by idempotency key.`, 'info');
        } else {
          showToast(`Memory pushed successfully to inbox!`, 'success');
        }
        closePushModal();
        refreshAll();
      } catch (err) {
        showToast(`Failed to push: ${err.message}`, 'error');
      }
    }

    function logConsole(msg) {
      const c = document.getElementById('simConsole');
      const timeStr = new Date().toLocaleTimeString();
      c.innerHTML += `<div><span style="color:var(--text-sub);">[${timeStr}]</span> ${escapeHtml(msg)}</div>`;
      c.scrollTop = c.scrollHeight;
    }

    async function triggerSimulation() {
      logConsole("▶ Starting Full Sync Pipeline Simulation...");
      try {
        const res = await fetch('/api/run-simulation', { method: 'POST' });
        const out = await res.json();
        if (out.logs) {
          out.logs.forEach(l => logConsole(l));
        }
        showToast("Simulation completed successfully!", "success");
        refreshAll();
      } catch (err) {
        logConsole(`❌ Simulation error: ${err.message}`);
        showToast("Simulation failed: " + err.message, "error");
      }
    }

    async function pushSampleBoltsFix() {
      const id = Math.floor(Math.random() * 899 + 100);
      const res = await fetch('/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idem_key: 'sample_m8_' + Date.now(),
          device_id: 'device-A',
          mem_id: `mem_fix_${id}`,
          text: `Torque for M8 flange bolts is 45 Nm per service bulletin #${id}.`,
          reason: 'Mechanical procedure update'
        })
      });
      showToast("Pushed M8 torque note to inbox", "success");
      logConsole(`⚡ Device-A pushed new memory mem_fix_${id}`);
      refreshAll();
    }

    async function pushSampleDuplicateFix() {
      const res = await fetch('/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idem_key: 'sample_dup_' + Date.now(),
          device_id: 'device-A',
          mem_id: 'mem_dup_999',
          text: 'Torque for M8 flange bolts is 45 Nm per the latest service bulletin.',
          reason: 'Duplicate text test for curator'
        })
      });
      showToast("Pushed duplicate fix (Curator will flag it)", "info");
      logConsole("⚠️ Device-A pushed identical text (tests duplicate detection in curator)");
      refreshAll();
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function refreshAll() {
      loadStats();
      loadInbox();
      loadKnowledge();
      loadDevices();
    }

    // Initial load and periodic polling
    refreshAll();
    setInterval(refreshAll, 5000);
  </script>
</body>
</html>
"""
