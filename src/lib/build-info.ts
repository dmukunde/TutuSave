// Vercel sets these automatically for every deployment — no config needed.
// Lets you confirm two devices are actually looking at the same build
// instead of guessing from feature symptoms.
export function getBuildInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;

  return {
    commit: sha ? sha.slice(0, 7) : "local",
    env: process.env.VERCEL_ENV ?? "development",
  };
}
