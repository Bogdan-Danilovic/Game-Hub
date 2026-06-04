export default function UnoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(125% 100% at 50% 0%, #1c0d00 0%, #110a00 46%, #080b14 100%)',
        color: '#f1f5f9',
      }}
    >
      <div
        className="breathing-orb"
        style={{
          width: 560,
          height: 560,
          top: '-16%',
          left: '-14%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.35), transparent 70%)',
        }}
      />
      <div
        className="breathing-orb"
        style={{
          width: 460,
          height: 460,
          bottom: '-14%',
          right: '-12%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.2), transparent 70%)',
          animationDelay: '3s',
        }}
      />
      <div
        className="breathing-orb"
        style={{
          width: 300,
          height: 300,
          top: '40%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.15), transparent 70%)',
          animationDelay: '6s',
        }}
      />
      <div className="relative flex-1 flex flex-col">{children}</div>
    </div>
  );
}
