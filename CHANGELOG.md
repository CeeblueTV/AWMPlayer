# 1.0.5 (2021-10-13)

---
## New Features
- Added trackChanged event to HLS and MP4.
- Added forceTrack that make wrappers start with certain track (with the lowest bitrate by default)
- Added possibility to import the player using ECMAScript module system
- Added possibility to use the player with TypeScript
- Added possibility to use the package as npm dependency (at least as repository reference)

## Bug fixes
- Metric/Reporting module fix
- Minor player fixes. Disabled embedded abr
- Update logic when video does not start at timestamp 0 (MP4oWS)
- Reopen WS if playback attempted (MP4oWS)
- Add error handling if autoplay disabled (MP4oWS)
- Fix startup when tabbed out (MP4oWS)
 
# 1.0.2 (2021-09-29)

---
## New Features
- Added ABR
- Add statistic module

## Updates
- Update error handling in MP4oWS module
- Stored a player count of instances
- Update behavior on ws disconnect

## Bug fixes
- MP4oWS volume set
- Wrong starting for MP4oWS (remove loop when track changed or seek)
- Browser crash for MP4oWS
- Fix pause in WebRTC
- Fixed seek loop
- UI fix (load spinner, control bar for small monitor etc)
- Minor player fix
