export function Footer() {
  return (
    <footer className="mt-8 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} VogueGarb. Lagos, Nigeria.</p>
        <p>Fashion design &amp; styling · Pay on delivery</p>
      </div>
    </footer>
  );
}
