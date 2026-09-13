-- Persistent application settings used by server-side features.
CREATE TABLE IF NOT EXISTS easycorp.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


INSERT INTO easycorp.app_settings (key, value)
VALUES (
  'candidate_invitation_email',
  jsonb_build_object(
    'subject', 'Undangan Asesmen - EasyLegal',
    'textTemplate', E'Halo {{candidateName}},\n\nAnda diundang untuk mengikuti tahapan asesmen EasyLegal untuk posisi {{position}}.\n\nLengkapi biodata dan mulai asesmen melalui tautan berikut:\n{{link}}\n\nAnda juga dapat masuk melalui halaman kandidat:\n{{loginLink}}\nToken: {{token}}\n\nToken ini berlaku hingga {{expiresAt}}.\n\nTerima kasih,\nTim HR EasyLegal',
    'htmlTemplate', '<p>Halo <strong>{{candidateName}}</strong>,</p><p>Anda diundang untuk mengikuti tahapan asesmen EasyLegal untuk posisi <strong>{{position}}</strong>.</p><p><a href="{{link}}">Lengkapi Biodata dan Mulai Asesmen</a></p><p>Anda juga dapat masuk melalui <a href="{{loginLink}}">halaman kandidat</a> menggunakan token berikut:</p><p><strong>{{token}}</strong></p><p>Token ini berlaku hingga <strong>{{expiresAt}}</strong>.</p><p>Terima kasih,<br><strong>Tim HR EasyLegal</strong></p>'
  )
)
ON CONFLICT (key) DO NOTHING;
