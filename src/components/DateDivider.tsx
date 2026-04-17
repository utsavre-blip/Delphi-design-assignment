"use client";

interface DateDividerProps {
  /** e.g. "Yesterday" or "Monday" */
  label: string;
  /** e.g. "3:38 PM" */
  time: string;
}

export default function DateDivider({ label, time }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center py-2 w-full select-none">
      <span className="text-[12px] leading-[16px] text-[#7d7b74]">
        <span className="font-semibold">{label} </span>
        <span className="font-normal">{time}</span>
      </span>
    </div>
  );
}
