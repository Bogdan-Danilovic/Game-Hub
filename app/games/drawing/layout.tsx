export default function DrawingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#080b14] text-[#c8d0e0] overflow-hidden">
      <div className="breathing-orb w-[500px] h-[500px] bg-amber-600/20 -top-40 -left-40" />
      <div className="breathing-orb w-[400px] h-[400px] bg-orange-600/15 -bottom-32 -right-32" style={{ animationDelay: '4s' }} />
      <div className="scanline" />
      <div className="relative flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
