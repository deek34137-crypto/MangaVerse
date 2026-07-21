# Mobile Compatibility & QA Checklist

## Device & Viewport Test Matrix

| Device Class | Viewport Width | Browsers Tested | Verification Status |
| :--- | :--- | :--- | :--- |
| **Small Phone** | 320px – 360px | Android Chrome, iOS Safari | ✅ Verified |
| **Standard Phone** | 390px – 412px | Android Chrome, Firefox, Samsung Internet | ✅ Verified |
| **Large Phone / Phablet**| 428px – 480px | iOS Safari, Edge Mobile | ✅ Verified |
| **Small Tablet (Portrait)**| 768px | iPadOS Safari, Android Chrome | ✅ Verified |
| **Tablet (Landscape)** | 1024px | iPadOS Safari, Android Chrome | ✅ Verified |

---

## Phase X.1 QA Checklist

- [x] **Safe-Area Support**: Viewports with notches/dynamic islands respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- [x] **Bottom Navigation Bar**: Fixed `<BottomNav />` renders smoothly on viewports <768px with active indicators and haptic feedback.
- [x] **Auto-Hiding Mobile Header**: Header automatically translates up on scroll down past 80px and reveals instantly on scroll up.
- [x] **Mobile Fullscreen Search Overlay**: Tapping search on mobile launches fullscreen overlay with auto-focused input, recent searches, trending pills, and voice search trigger.
- [x] **Touch Targets**: All interactive buttons, nav links, and controls enforce minimum 44px touch targets (`.touch-target`).
- [x] **Touch Press Feedback**: Buttons present instant visual press feedback (`.active-press`).
- [x] **PWA Install Banner & Offline Shell**: `<InstallPromptBanner />` displays on installable mobile devices, and offline mode serves `/offline` shell.
- [x] **Mobile Keyboards & Forms**: Auth inputs specify `inputMode="email"`, `inputMode="numeric"`, `autoCapitalize="none"`, and `autoComplete`.
