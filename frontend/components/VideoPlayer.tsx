export default function VideoPlayer({ src, teamName }: { src: string; teamName: string }) {
  return (
    <video
      controls
      playsInline
      preload="metadata"
      className="w-full rounded-lg border border-navy-deep/10 bg-black shadow-md"
      aria-label={`${teamName} product video`}
    >
      <source src={src} />
      Your browser does not support the video tag.
    </video>
  );
}
