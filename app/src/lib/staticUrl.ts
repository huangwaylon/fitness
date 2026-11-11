// A static file's URL (app/static/…, under the base path) for a path built at run time: $app/paths' asset() types its
// argument as the files present at build, so a template path needs a cast, made once here. A path is relative to
// static/ (`hiking/tracks/x.json`); a leading slash is dropped (asset() warns on one).
import { asset } from '$app/paths';

export const staticUrl = (path: string): string => asset(path.replace(/^\/+/, '') as Parameters<typeof asset>[0]);
