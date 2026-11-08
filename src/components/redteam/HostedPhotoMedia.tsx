import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
export interface PhotoArtefact { kind: 'photo'; storagePath: string; caption: string; subject: string }
export function asPhoto(value: unknown): PhotoArtefact | null {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'photo' || !('storagePath' in value) || typeof value.storagePath !== 'string') return null;
  return value as PhotoArtefact;
}
export default function HostedPhotoMedia({ photo, thumbnail = false }: { photo: PhotoArtefact; thumbnail?: boolean }) {
  const [url, setUrl] = useState<string | null>(null); const [error, setError] = useState(false);
  useEffect(() => { let cancelled = false; void supabase.storage.from('exercise-photos').createSignedUrl(photo.storagePath, 900).then(({ data, error }) => { if (!cancelled) { setUrl(data?.signedUrl ?? null); setError(Boolean(error)); } }); return () => { cancelled = true; }; }, [photo.storagePath]);
  return <figure className={thumbnail ? 'h-full w-full' : 'my-4 space-y-2'}>{url ? <img src={url} alt="Fictional AI-generated exercise photo" className={thumbnail ? 'h-full w-full object-cover' : 'max-h-[520px] w-full rounded-md object-contain'} /> : <p className="p-3 text-xs text-muted-foreground">{error ? 'Photo unavailable.' : 'Loading photo…'}</p>}{!thumbnail && <figcaption className="text-xs text-crimson">FICTIONAL EXERCISE · AI-generated, not evidence</figcaption>}</figure>;
}