'use client';

interface AdminWelcomeProps {
  userName: string;
  lastLogin?: string | null;
}

export function AdminWelcome({ userName, lastLogin }: AdminWelcomeProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome {userName}
      </h1>
      {lastLogin && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            Your last login: {lastLogin}
          </p>
          <a 
            href="#" 
            className="text-sm text-blue-600 underline hover:text-blue-700"
            onClick={(e) => {
              e.preventDefault();
              // Could open a history view modal or navigate
            }}
          >
            View history
          </a>
        </div>
      )}
    </div>
  );
}

