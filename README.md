# ACU Vice Dean Desk — M1A Legacy Tablet Prototype

Scope: self-contained, offline-capable frontend with illustrative data. Tested target: Samsung Galaxy Tab 10.1 GT-P7500R / Android 4.0.4 stock browser. No external assets, dependencies, backend, authentication, data collection, or AI connectivity.

## Launch on Mac

1. Extract ZIP and open Terminal in the `ACU_Vice_Dean_Desk_M1A` folder.
2. `python3 -m http.server 8080 --bind 0.0.0.0`
3. On another terminal: `ipconfig getifaddr en0` (find Wi-Fi IP; may differ if another interface is used).
4. On tablet on same trusted Wi-Fi: `http://<MAC_IP>:8080/` (HTTP, **not** HTTPS).
5. Keep terminal open; stop with Ctrl+C after test. Do not expose port 8080 to the Internet.

If port 8080 is already occupied, stop the old server with Ctrl+C first, or run on 8081 and adjust URL.

## Acceptance checks

- Page loads and displays two-column dashboard in landscape.
- `My Day`, `Exams`, `My Tasks`, `Alerts`, `Assistant` buttons switch content.
- `Test touch` displays TOUCH OK.
- Clock and tick counter increment; context changes with time of day.
- All sample records are visibly labeled demo. No real university or student records.
- Reload and check performance; test sustained operation only after battery safety check.

## Limitations / next steps

M1A is NOT production. It uses device local time, not authoritative server time. All data is hard-coded, not persisted. No secure login, live alerts, calendar integration, voice, agent control, offline data sync, or autonomous Mac-independent hosting. Android 4.0.4 is unsupported; do not access sensitive systems or expose this device to untrusted networks. For always-on deployment, host an approved read-only sanitized view behind an appropriate gateway, with sensitive functions on a modern device.
