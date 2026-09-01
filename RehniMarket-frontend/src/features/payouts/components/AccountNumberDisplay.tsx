export default function AccountNumberDisplay({ value }: { value: string }) {
  return (
    <span className="inline-block rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-sm text-gray-900">
      {value}
    </span>
  );
}
