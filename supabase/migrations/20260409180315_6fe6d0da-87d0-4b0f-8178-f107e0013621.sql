
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-videos', 'generated-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for generated videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-videos');

CREATE POLICY "Allow uploads to generated videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-videos');
