# 1.0.5 (2021-10-13)

---
## New Features
- Added trackChanged event to HLS and MP4.
- Added forceTrack that make wrappers start with certain track (with the lowest bitrate by default)

## Bug fixes
- Metric/Reporting module fix
- Minor player fixes. Disabled embedded abr
 
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
