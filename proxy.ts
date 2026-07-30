import { clerkMiddleware } from "@clerk/nextjs/server";

const protectedPagePrefixes = [
  "/dashboard",
  "/consult",
  "/results",
];

export default clerkMiddleware(async (auth, request) => {
  const isProtectedPage = protectedPagePrefixes.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPage) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
