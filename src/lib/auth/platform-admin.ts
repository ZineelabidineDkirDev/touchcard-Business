export const PLATFORM_SUPER_ADMIN_EMAIL = "zainmawada@gmail.com";

export function isPlatformSuperAdmin(email: string | null | undefined) {
  return email?.trim().toLowerCase() === PLATFORM_SUPER_ADMIN_EMAIL;
}
