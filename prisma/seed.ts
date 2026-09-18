// Seeds categories, sample products, gift boxes, shipping zones, promo codes,
// store settings and the first admin user. Safe to run more than once.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Color, type ProductTag } from "../src/generated/prisma/client";
import { GOVERNORATES } from "../src/lib/constants";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const egp = (n: number) => Math.round(n * 100);

const CATEGORIES = [
  { name: "Necklaces", slug: "necklaces", description: "Delicate chains and pendants to layer or wear alone.", image: "/samples/aurelia-gold.webp" },
  { name: "Hand Chains", slug: "hand-chains", description: "Graceful chains that link wrist to finger.", image: "/samples/nile-gold.webp" },
  { name: "Charms", slug: "charms", description: "Meaningful charms to personalise your pieces.", image: "/samples/crescent-gold.webp" },
  { name: "Rings", slug: "rings", description: "Everyday stackers and statement rings.", image: "/samples/solstice-gold.webp" },
  { name: "Earrings", slug: "earrings", description: "Hoops, studs and drops for every mood.", image: "/samples/hoops-gold.webp" },
  { name: "Bracelets", slug: "bracelets", description: "Chains and tennis bracelets made to be stacked.", image: "/samples/cuban-gold.webp" },
];

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categories: string[];
  tags: ProductTag[];
  images: string[];
  variants: Partial<Record<Color, number>>;
  soldCount?: number;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Aurelia Pendant Necklace",
    slug: "aurelia-pendant-necklace",
    sku: "JX-NK-001",
    description:
      "A softly sculpted teardrop pendant set with a single crystal, suspended from a fine cable chain. Adjustable 40–45 cm length. Tarnish-resistant, hypoallergenic finish.",
    price: 950,
    compareAtPrice: 1200,
    categories: ["necklaces"],
    tags: ["BEST_SELLER", "SALE"],
    images: ["/samples/aurelia-gold.webp", "/samples/aurelia-silver.webp", "/samples/aurelia-rose.webp"],
    variants: { GOLD: 14, SILVER: 9, ROSE_GOLD: 6 },
    soldCount: 86,
  },
  {
    name: "Lumière Layered Chain",
    slug: "lumiere-layered-chain",
    sku: "JX-NK-002",
    description: "Two chains, one clasp: a bold curb chain layered with a delicate link for an effortless stacked look. 42 cm and 48 cm.",
    price: 1150,
    categories: ["necklaces"],
    tags: ["NEW"],
    images: ["/samples/lumiere-gold.webp", "/samples/lumiere-silver.webp"],
    variants: { GOLD: 10, SILVER: 7 },
    soldCount: 21,
  },
  {
    name: "Nile Hand Chain",
    slug: "nile-hand-chain",
    sku: "JX-HC-001",
    description: "A fluid hand chain linking a fine bracelet to a slim ring, with a crystal centrepiece resting on the back of the hand.",
    price: 780,
    categories: ["hand-chains"],
    tags: ["BEST_SELLER"],
    images: ["/samples/nile-gold.webp", "/samples/nile-rose.webp"],
    variants: { GOLD: 12, ROSE_GOLD: 8 },
    soldCount: 64,
  },
  {
    name: "Celeste Hand Chain",
    slug: "celeste-hand-chain",
    sku: "JX-HC-002",
    description: "Minimal and modern — a whisper-fine chain with a sparkling crystal junction. Adjustable bracelet and ring sizes.",
    price: 690,
    categories: ["hand-chains"],
    tags: ["NEW"],
    images: ["/samples/celeste-silver.webp"],
    variants: { SILVER: 10 },
    soldCount: 12,
  },
  {
    name: "Crescent Moon Charm",
    slug: "crescent-moon-charm",
    sku: "JX-CH-001",
    description: "A polished crescent moon with two tiny stars. Clip it onto any chain or bracelet.",
    price: 350,
    categories: ["charms"],
    tags: ["BEST_SELLER"],
    images: ["/samples/crescent-gold.webp", "/samples/crescent-silver.webp"],
    variants: { GOLD: 20, SILVER: 15 },
    soldCount: 58,
  },
  {
    name: "Initial Heart Charm",
    slug: "initial-heart-charm",
    sku: "JX-CH-002",
    description: "A soft heart charm engraved with a delicate initial — a keepsake to carry every day.",
    price: 420,
    compareAtPrice: 500,
    categories: ["charms"],
    tags: ["SALE"],
    images: ["/samples/heart-rose.webp", "/samples/heart-gold.webp"],
    variants: { ROSE_GOLD: 12, GOLD: 12 },
    soldCount: 30,
  },
  {
    name: "Solstice Solitaire Ring",
    slug: "solstice-solitaire-ring",
    sku: "JX-RG-001",
    description: "A classic solitaire reimagined: a round brilliant crystal raised on a slender polished band.",
    price: 650,
    categories: ["rings"],
    tags: ["BEST_SELLER", "NEW"],
    images: ["/samples/solstice-gold.webp", "/samples/solstice-silver.webp"],
    variants: { GOLD: 11, SILVER: 11 },
    soldCount: 72,
  },
  {
    name: "Twisted Band Ring",
    slug: "twisted-band-ring",
    sku: "JX-RG-002",
    description: "Two intertwined bands for a sculptural, stackable ring with a soft sheen.",
    price: 480,
    categories: ["rings"],
    tags: [],
    images: ["/samples/twist-rose.webp", "/samples/twist-gold.webp"],
    variants: { ROSE_GOLD: 8, GOLD: 2 },
    soldCount: 18,
  },
  {
    name: "Pearl Drop Earrings",
    slug: "pearl-drop-earrings",
    sku: "JX-ER-001",
    description: "Lustrous freshwater-style pearls hanging from fine hooks — timeless from day to evening.",
    price: 720,
    categories: ["earrings"],
    tags: ["NEW"],
    images: ["/samples/pearl-gold.webp", "/samples/pearl-silver.webp"],
    variants: { GOLD: 9, SILVER: 6 },
    soldCount: 25,
  },
  {
    name: "Mini Hoop Earrings",
    slug: "mini-hoop-earrings",
    sku: "JX-ER-002",
    description: "Chunky mini hoops with a comfortable click-shut closure. The pair you'll never take off.",
    price: 540,
    compareAtPrice: 650,
    categories: ["earrings"],
    tags: ["BEST_SELLER", "SALE"],
    images: ["/samples/hoops-gold.webp", "/samples/hoops-silver.webp", "/samples/hoops-rose.webp"],
    variants: { GOLD: 18, SILVER: 12, ROSE_GOLD: 7 },
    soldCount: 95,
  },
  {
    name: "Classic Tennis Bracelet",
    slug: "classic-tennis-bracelet",
    sku: "JX-BR-001",
    description: "A continuous line of brilliant crystals in secure settings. 17 cm with a 2 cm extender.",
    price: 1350,
    categories: ["bracelets"],
    tags: ["BEST_SELLER"],
    images: ["/samples/tennis-silver.webp", "/samples/tennis-gold.webp"],
    variants: { SILVER: 8, GOLD: 6 },
    soldCount: 44,
  },
  {
    name: "Cuban Link Bracelet",
    slug: "cuban-link-bracelet",
    sku: "JX-BR-002",
    description: "A bold, polished Cuban link with a secure box clasp. Wear it alone or stack it.",
    price: 890,
    categories: ["bracelets"],
    tags: ["NEW"],
    images: ["/samples/cuban-gold.webp", "/samples/cuban-silver.webp"],
    variants: { GOLD: 10, SILVER: 10 },
    soldCount: 15,
  },
];

const GIFT_BOXES = [
  {
    name: "The Golden Hour Box",
    slug: "the-golden-hour-box",
    description:
      "Our signature set in warm gold: the Aurelia pendant, Mini Hoop earrings and the Cuban Link bracelet, presented in a JEXI keepsake box with a handwritten card.",
    coverImage: "/samples/giftbox-gold.webp",
    price: 1990,
    items: [
      { sku: "JX-NK-001", color: "GOLD" as Color },
      { sku: "JX-ER-002", color: "GOLD" as Color },
      { sku: "JX-BR-002", color: "GOLD" as Color },
    ],
  },
  {
    name: "Rosé Keepsake Box",
    slug: "rose-keepsake-box",
    description: "A romantic trio in rose gold — the Nile hand chain, Initial Heart charm and Twisted Band ring. Gift-wrapped and ready to give.",
    coverImage: "/samples/giftbox-rose.webp",
    price: 1450,
    items: [
      { sku: "JX-HC-001", color: "ROSE_GOLD" as Color },
      { sku: "JX-CH-002", color: "ROSE_GOLD" as Color },
      { sku: "JX-RG-002", color: "ROSE_GOLD" as Color },
    ],
  },
];

async function main() {
  // Settings
  await db.storeSettings.upsert({
    where: { id: 1 },
    create: { id: 1, contactEmail: process.env.GMAIL_USER || null, instagram: "jexi.accessories" },
    update: {},
  });

  // Admin
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@jexi.store").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const existingAdmin = await db.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.adminUser.create({
      data: {
        email: adminEmail,
        name: process.env.ADMIN_NAME || "JEXI Owner",
        role: "OWNER",
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log(`Created admin ${adminEmail}`);
  }

  // Shipping zones
  for (const [i, g] of GOVERNORATES.entries()) {
    await db.shippingZone.upsert({
      where: { name: g.name },
      create: { name: g.name, enabled: true, estimatedDelivery: g.eta, sortOrder: i },
      update: {},
    });
  }

  // Categories
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i },
      update: {},
    });
    categoryIds[c.slug] = cat.id;
  }

  // Products
  const now = Date.now();
  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await db.product.findUnique({ where: { sku: p.sku } });
    if (exists) continue;
    await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        price: egp(p.price),
        compareAtPrice: p.compareAtPrice ? egp(p.compareAtPrice) : null,
        images: p.images,
        tags: p.tags,
        published: true,
        soldCount: p.soldCount ?? 0,
        createdAt: new Date(now - (PRODUCTS.length - i) * 86_400_000),
        categories: { connect: p.categories.map((slug) => ({ id: categoryIds[slug] })) },
        variants: {
          create: Object.entries(p.variants).map(([color, stock]) => ({
            color: color as Color,
            stock: stock!,
            sku: `${p.sku}-${color === "ROSE_GOLD" ? "RG" : color.slice(0, 2)}`,
          })),
        },
      },
    });
  }

  // Gift boxes
  for (const box of GIFT_BOXES) {
    if (await db.giftBox.findUnique({ where: { slug: box.slug } })) continue;
    const items = [];
    for (const item of box.items) {
      const variant = await db.variant.findFirst({ where: { color: item.color, product: { sku: item.sku } } });
      if (variant) items.push({ productId: variant.productId, variantId: variant.id, quantity: 1 });
    }
    await db.giftBox.create({
      data: {
        name: box.name,
        slug: box.slug,
        description: box.description,
        coverImage: box.coverImage,
        price: egp(box.price),
        published: true,
        items: { create: items },
      },
    });
  }

  // Promo codes
  const day = 86_400_000;
  await db.promoCode.upsert({
    where: { code: "JEXI20" },
    create: {
      code: "JEXI20",
      description: "20% off everything",
      discountType: "PERCENTAGE",
      value: 20,
      startsAt: new Date(now - day),
      endsAt: new Date(now + 60 * day),
      usageLimit: 100,
      perCustomerLimit: 1,
    },
    update: {},
  });
  await db.promoCode.upsert({
    where: { code: "WELCOME100" },
    create: {
      code: "WELCOME100",
      description: "EGP 100 off orders over EGP 800",
      discountType: "FIXED",
      value: egp(100),
      minOrderValue: egp(800),
      startsAt: new Date(now - day),
      endsAt: new Date(now + 30 * day),
      usageLimit: 50,
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
