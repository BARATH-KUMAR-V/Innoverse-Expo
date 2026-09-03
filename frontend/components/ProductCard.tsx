import Image from "next/image";
import Link from "next/link";
import { GalleryTeam } from "@/lib/types";

export default function ProductCard({ team }: { team: GalleryTeam }) {
  return (
    <Link
      href={`/product/${team.id}`}
      className="group block overflow-hidden rounded-lg border border-navy-deep/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
    >
      <div className="relative w-full overflow-hidden bg-navy-deep/5">
        {team.imageUrl ? (
          <Image
            src={team.imageUrl}
            alt={team.teamName}
            width={800}
            height={800}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="w-full h-auto transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-navy-deep/25">
            <PlaceholderIcon />
          </div>
        )}
      </div>
      <div className="border-t border-gold/20 px-5 py-4 text-center">
        <p className="font-serif text-base tracking-wide text-navy-deep">{team.teamName}</p>
      </div>
    </Link>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}
