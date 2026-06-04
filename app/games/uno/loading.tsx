export default function UnoLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full animate-pulse"
          style={{ background: 'rgba(249,115,22,0.4)' }}
        />
        <span className="text-xs text-slate-500 animate-pulse">Učitavanje...</span>
      </div>
    </div>
  );
}
