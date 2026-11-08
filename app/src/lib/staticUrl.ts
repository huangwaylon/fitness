// A static file's URL (app/static/…, under the base path) for a path built at run time: $app/paths' asset() types its
// argument as the files present at build, so a template path needs a cast, made once here.
import { asset } from '$app/paths';

export const staticUrl = (path: string): string => asset(path as Parameters<typeof asset>[0]);
