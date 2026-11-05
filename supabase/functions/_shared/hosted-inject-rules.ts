export const VIDEO_DURATION_SECONDS = 8;
export const VIDEO_CREATE_LIMIT = 10;
export function canHostVideo(isAdmin: boolean, userId: string, ownerId: string | null) {
  return isAdmin && userId === ownerId;
}
export function canPublishVideo(status: string, storagePath: string | null, sessionStatus: string) {
  return status === 'completed' && Boolean(storagePath) && sessionStatus === 'active';
}