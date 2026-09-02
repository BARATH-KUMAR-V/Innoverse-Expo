-- =============================================================================
-- OPTIONAL sample data - lets you click through the full voting flow locally
-- before any real teams have been added by the admin.
--
-- Safe to skip entirely. Delete these rows from the admin "Manage Teams" page
-- (or re-run without this file) before the real event goes live.
-- =============================================================================

insert into teams (team_name, image_url, video_url, is_active)
values
  (
    'Team Alpha',
    'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=1200&q=80',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    true
  ),
  (
    'Team Beta',
    'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=1200&q=80',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    true
  ),
  (
    'Team Gamma',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    true
  )
on conflict do nothing;
