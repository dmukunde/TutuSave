import { getUser, getProfile } from "@/lib/supabase/dal";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await getUser();
  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm">{user?.email}</p>
          </div>
          <ProfileForm currentFullName={profile?.full_name ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
