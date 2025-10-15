import { LoginButton } from "./login-button";

export function LoginButtonDemo() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Login Button Variations</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Default Login Button</h3>
          <LoginButton />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Large Login Button</h3>
          <LoginButton size="lg" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Small Login Button</h3>
          <LoginButton size="sm" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Login Button with Custom Avatar</h3>
          <LoginButton 
            avatarSrc="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            avatarAlt="User profile picture"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Login Button without Avatar</h3>
          <LoginButton showAvatar={false} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Custom Login Button</h3>
          <LoginButton className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Sign In
          </LoginButton>
        </div>
      </div>
    </div>
  );
}
