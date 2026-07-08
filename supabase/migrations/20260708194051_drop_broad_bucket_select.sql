-- Public bucket serves object URLs without a SELECT policy; a broad
-- SELECT policy only adds the ability to LIST all files (lint 0025).
drop policy "tenant assets are publicly readable" on storage.objects;
