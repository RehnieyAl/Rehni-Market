import PublicProductCollection from "./PublicProductCollection";

import type { PublicProductsPaginated } from "../types/response";

interface CollectionViewProps {
  title: string;
  subtitle: string;
  emptyMessage: string;
  fetchPage: (page: number, limit: number) => Promise<PublicProductsPaginated>;
}

export default function CollectionView({
  title,
  subtitle,
  emptyMessage,
  fetchPage,
}: CollectionViewProps) {
  return (
    <section className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>
      </header>

      <PublicProductCollection fetchPage={fetchPage} emptyMessage={emptyMessage} />
    </section>
  );
}
