// Skeleton con la misma silueta que la página real (banner + logo +
// información + grid de productos) - mismo criterio que
// ProductDetailSkeleton.
export default function CompanyProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-40 w-full bg-gray-200 sm:h-56 lg:h-72" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 flex flex-col items-center sm:-mt-16 sm:items-start lg:-mt-20">
          <div className="h-24 w-24 rounded-2xl border-4 border-white bg-gray-200 sm:h-32 sm:w-32 lg:h-40 lg:w-40" />
        </div>

        <div className="mt-4 space-y-3 text-center sm:text-left">
          <div className="mx-auto h-7 w-52 rounded bg-gray-200 sm:mx-0" />
          <div className="mx-auto h-4 w-full max-w-xl rounded bg-gray-200 sm:mx-0" />
          <div className="mx-auto h-4 w-2/3 max-w-xl rounded bg-gray-200 sm:mx-0" />
        </div>

        <div className="mt-6 h-20 w-full rounded-2xl bg-gray-200" />

        <div className="mt-10 h-6 w-48 rounded bg-gray-200" />

        <div className="mt-5 grid grid-cols-2 gap-4 pb-10 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square w-full rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
