/** Esqueleto de carga del perfil público de empresa, con el mismo marco de banner. */
import { BANNER_FRAME } from "@/features/company/components/CompanyBanner";

export default function CompanyProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] animate-pulse px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
      <div className="h-4 w-32 rounded bg-gray-200" />

      <div className="mt-4 overflow-hidden rounded-card border border-hairline bg-surface-1">
        <div className={`${BANNER_FRAME} w-full bg-gray-300`} />
        <div className="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:gap-6 sm:px-6 sm:pb-6 lg:px-8">
          <div className="-mt-12 h-24 w-24 shrink-0 rounded-card border-4 border-surface-1 bg-gray-300 sm:-mt-16 sm:h-32 sm:w-32 lg:-mt-20 lg:h-36 lg:w-36" />

          <div className="flex-1 space-y-3">
            <div className="h-9 w-64 rounded bg-gray-300" />
            <div className="h-4 w-full max-w-md rounded bg-gray-300" />
            <div className="h-4 w-64 rounded bg-gray-300" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4 border-b border-gray-200 pb-3">
        <div className="h-5 w-20 rounded bg-gray-200" />
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-5 w-32 rounded bg-gray-200" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="h-40 rounded-card bg-gray-200" />
          <div className="h-56 rounded-card bg-gray-200" />
        </div>

        <div className="order-1 lg:order-2">
          <div className="h-7 w-52 rounded bg-gray-200" />

          <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-72 w-full rounded-card bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
