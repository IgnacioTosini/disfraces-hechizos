-- CreateTable
CREATE TABLE "HomeHero" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "eyebrow" TEXT NOT NULL DEFAULT 'Disfraces para cada ocasión',
    "titleLineOne" TEXT NOT NULL DEFAULT 'Hoy podés',
    "titleLineTwo" TEXT NOT NULL DEFAULT 'ser',
    "titleHighlight" TEXT NOT NULL DEFAULT 'quien quieras',
    "description" TEXT NOT NULL DEFAULT 'Encontrá el disfraz ideal para tu próxima fiesta, evento o celebración. Explorá nuestro catálogo y consultá por tu próximo look.',
    "primaryCtaLabel" TEXT NOT NULL DEFAULT 'Explorar disfraces',
    "secondaryCtaLabel" TEXT NOT NULL DEFAULT 'Cómo funciona el alquiler',
    "locationText" TEXT NOT NULL DEFAULT 'Local en España 1744 · Mar del Plata',
    "imageUrl" TEXT NOT NULL DEFAULT '/images/hero-disfraces.webp',
    "imagePublicId" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT 'Cuatro personas con disfraces de pirata, reina egipcia, guerrera y astronauta',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeHero_pkey" PRIMARY KEY ("id")
);
