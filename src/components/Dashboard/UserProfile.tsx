interface UserProfileProps {
  user: any;
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">
        👋 Welcome back,{" "}
        {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
        !
      </h1>
      <p className="text-gray-600 mt-1">Your job search dashboard</p>
    </div>
  );
}
