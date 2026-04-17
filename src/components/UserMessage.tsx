"use client";

interface UserMessageProps {
  children: React.ReactNode;
}

export default function UserMessage({ children }: UserMessageProps) {
  return (
    <div className="flex items-start justify-end w-full">
      <div className="flex flex-col items-end" style={{ maxWidth: "588px" }}>
        {/* Bubble */}
        <div
          className="relative px-3 py-2 rounded-[20px] overflow-hidden"
          style={{ maxWidth: "516px" }}
        >
          {/* Orange translucent background */}
          <div
            className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{ background: "rgba(205, 64, 0, 0.6)" }}
          />

          {/* Inner highlight ring */}
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              boxShadow:
                "inset 0px 1px 2px 0px rgba(255, 255, 255, 0.06), inset 0px -1px 2px 0px rgba(0, 0, 0, 0.2), inset 0px 0px 0px 1px rgba(255, 168, 133, 0.24)",
            }}
          />

          {/* Text */}
          <p
            className="relative text-white font-medium leading-6 z-10"
            style={{ fontSize: "15.8px" }}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
