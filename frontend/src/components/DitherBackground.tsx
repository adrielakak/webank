import React from "react";

export const DitherBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Left Deep Cyan Radial Glow */}
      <div 
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #00D2FF 0%, rgba(0, 102, 255, 0) 70%)" }}
      />
      {/* Bottom Right Deep WeBank Blue Glow */}
      <div 
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 blur-[140px]"
        style={{ background: "radial-gradient(circle, #0066FF 0%, rgba(16, 185, 129, 0) 70%)" }}
      />
      {/* Center Subtle Dark Mesh Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
    </div>
  );
};
