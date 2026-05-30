export default function Flip7Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(125% 100% at 50% 0%, #0c2138 0%, #0a1626 46%, #070d18 100%)',
        color: '#e9e2d4',
      }}
    >
      <div
        className="breathing-orb"
        style={{
          width: 560,
          height: 560,
          top: '-16%',
          left: '-14%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.40), transparent 70%)',
        }}
      />
      <div
        className="breathing-orb"
        style={{
          width: 460,
          height: 460,
          bottom: '-14%',
          right: '-12%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.28), transparent 70%)',
          animationDelay: '4s',
        }}
      />
      <div className="relative flex-1 flex flex-col">{children}</div>
    </div>
  );
}
