import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { ProfileForm } from "@/components/forms";
import { SignOut } from "@/components/auth-form";
import { pageActor } from "@/server/page-access";
import { getProfile } from "@/server/data";
export const dynamic = "force-dynamic";
export default async function Profile() {
  const actor = await pageActor();
  if (!actor)
    return (
      <Shell active="Profile">
        <Setup />
      </Shell>
    );
  const profile = await getProfile(actor);
  return (
    <Shell active="Profile">
      <div className="page-heading">
        <div>
          <h1>Your profile.</h1>
          <p>A few details to make this space yours.</p>
        </div>
      </div>
      {profile && <ProfileForm profile={profile} />}
      <SignOut />
    </Shell>
  );
}
