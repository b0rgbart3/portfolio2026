const projectImages = import.meta.glob(
  "../assets/projects/*.{jpg,jpeg,png,webp,gif,avif,svg}",
  { eager: true },
);

export function getProjectImageUrl(imageName: string): string {
  const key = `../assets/projects/${imageName}`;
  return (projectImages[key] as { default: string })?.default ?? "";
}
