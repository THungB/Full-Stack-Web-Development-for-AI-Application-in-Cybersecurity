# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **2026-03-29**: Integrate Telegram bot with FastAPI backend as a background thread using a dedicated asyncio event loop to avoid conflicts with FastAPI's event loop (Bui Tien Hung)
- **2026-03-29**: Add dedicated `GET /telegram/messages` and `DELETE /telegram/messages/{record_id}` endpoints for Telegram inbox management (Bui Tien Hung)
- **2026-03-29**: Add Telegram Inbox tab to the Scan page with filter, delete, and re-scan functionality (Bui Tien Hung)
- **2026-03-29**: Add `getTelegramMessages` and `deleteTelegramRecord` API functions to frontend service layer (Bui Tien Hung)
- **2026-03-29**: Skip scanning messages shorter than 10 characters silently in the Telegram bot to avoid 422 validation errors in group chats (Bui Tien Hung)

## [0.3.0] - 2026-03-28

### Changed
- **2026-03-28**: Small update and minor fixes (KindaRusty) [`e992a80`]

## [0.2.0] - 2026-03-23

### Added
- **2026-03-23**: Remove predictor and replace with trained ML model; update README and plan file (KindaRusty) [`e96fd27`]
- **2026-03-23**: Synchronize project progress documentation across `README.md`, `plan.md`, and `CHANGELOG.md` to reflect the actual repository state and assignment timeline (KindaRusty)
- **2026-03-23**: Add and document batch CSV scan support across the FastAPI API and React scan workspace as implemented extra scope beyond the original assignment plan (KindaRusty)
- **2026-03-23**: Document health-check driven system status, frontend API availability monitoring, and backend demo-seed behavior for first-run dashboards and history views (KindaRusty)
- **2026-03-23**: Refresh README run instructions, API surface notes, OCR/Tesseract setup guidance, and known verification status for build and tests (KindaRusty)

### Changed
- **2026-03-23**: Update README.md (KindaRusty) [`85dd340`]
- **2026-03-23**: Redesign and overhaul frontend UI/UX to improve layouts, colors, typography, and consistency across pages (THungB) [`11d6c57`]

## [0.1.0] - 2026-03-18

### Added
- **2026-03-18**: Add batch sample data and UI components for batch testing (KindaRusty) [`ddae6da`]
- **2026-03-18**: Update and improve frontend components (KindaRusty) [`866dcff`]
- **2026-03-18**: Add CHANGELOG.md to track project history (THungB) [`6aafc3a`]
- **2026-03-18**: Update README.md with project setup instructions (THungB) [`4729478`]
- **2026-03-18**: Remove unused files and update .gitignore (THungB) [`8730a65`]
- **2026-03-18**: Update .gitignore to exclude build artifacts and environment files (KindaRusty) [`9a453b6`]
- **2026-03-18**: Build full-stack spam detection app and browser extension (KindaRusty) [`b5e3074`]
- **2026-03-18**: Setup project environment and initial configuration (THungB) [`3dafd3c`]
- **2026-03-18**: Initial commit (Bui Tien Hung) [`7698ef2`]

Full commit history: https://github.com/THungB/Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity/commits/main

## Team Members

- Nguyen Thanh Kien ([KindaRusty](https://github.com/KindaRusty))
- Bui Tien Hung ([THungB](https://github.com/THungB))