"use client";

interface ContactItemProps {
  icon: React.ReactNode;
  text: string;
}

export default function ContactItem({ icon, text }: ContactItemProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}
