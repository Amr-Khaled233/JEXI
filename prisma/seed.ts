// Seeds categories, sample products, gift boxes, shipping zones, promo codes,
// store settings and the first admin user. Safe to run more than once.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ProductTag } from "../src/generated/prisma/client";
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

type ColorSlug = "gold" | "silver" | "rose-gold";

const COLORS: { name: string; slug: ColorSlug; hex: string }[] = [
  { name: "Gold", slug: "gold", hex: "#d4af37" },
  { name: "Silver", slug: "silver", hex: "#c0c0c0" },
  { name: "Rose Gold", slug: "rose-gold", hex: "#b76e79" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categories: string[];
  tags: ProductTag[];
  images: string[];
  variants: Partial<Record<ColorSlug, number>>;
  soldCount?: number;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Aurelia Pendant Necklace",
    slug: "aurelia-pendant-necklace",
    description:
      "A softly sculpted teardrop pendant set with a single crystal, suspended from a fine cable chain. Adjustable 40 to 45 cm length. Tarnish-resistant, hypoallergenic finish.",
    price: 950,
    compareAtPrice: 1200,
    categories: ["necklaces"],
    tags: ["BEST_SELLER", "SALE"],
    images: ["/samples/aurelia-gold.webp", "/samples/aurelia-silver.webp", "/samples/aurelia-rose.webp"],
    variants: { gold: 14, silver: 9, "rose-gold": 6 },
    soldCount: 86,
  },
  {
    name: "Lumière Layered Chain",
    slug: "lumiere-layered-chain",
    description: "Two chains, one clasp: a bold curb chain layered with a delicate link for an effortless stacked look. 42 cm and 48 cm.",
    price: 1150,
    categories: ["necklaces"],
    tags: ["NEW"],
    images: ["/samples/lumiere-gold.webp", "/samples/lumiere-silver.webp"],
    variants: { gold: 10, silver: 7 },
    soldCount: 21,
  },
  {
    name: "Nile Hand Chain",
    slug: "nile-hand-chain",
    description: "A fluid hand chain linking a fine bracelet to a slim ring, with a crystal centrepiece resting on the back of the hand.",
    price: 780,
    categories: ["hand-chains"],
    tags: ["BEST_SELLER"],
    images: ["/samples/nile-gold.webp", "/samples/nile-rose.webp"],
    variants: { gold: 12, "rose-gold": 8 },
    soldCount: 64,
  },
  {
    name: "Celeste Hand Chain",
    slug: "celeste-hand-chain",
    description: "Minimal and modern, a whisper-fine chain with a sparkling crystal junction. Adjustable bracelet and ring sizes.",
    price: 690,
    categories: ["hand-chains"],
    tags: ["NEW"],
    images: ["/samples/celeste-silver.webp"],
    variants: { silver: 10 },
    soldCount: 12,
  },
  {
    name: "Crescent Moon Charm",
    slug: "crescent-moon-charm",
    description: "A polished crescent moon with two tiny stars. Clip it onto any chain or bracelet.",
    price: 350,
    categories: ["charms"],
    tags: ["BEST_SELLER"],
    images: ["/samples/crescent-gold.webp", "/samples/crescent-silver.webp"],
    variants: { gold: 20, silver: 15 },
    soldCount: 58,
  },
  {
    name: "Initial Heart Charm",
    slug: "initial-heart-charm",
    description: "A soft heart charm engraved with a delicate initial, a keepsake to carry every day.",
    price: 420,
    compareAtPrice: 500,
    categories: ["charms"],
    tags: ["SALE"],
    images: ["/samples/heart-rose.webp", "/samples/heart-gold.webp"],
    variants: { "rose-gold": 12, gold: 12 },
    soldCount: 30,
  },
  {
    name: "Solstice Solitaire Ring",
    slug: "solstice-solitaire-ring",
    description: "A classic solitaire reimagined: a round brilliant crystal raised on a slender polished band.",
    price: 650,
    categories: ["rings"],
    tags: ["BEST_SELLER", "NEW"],
    images: ["/samples/solstice-gold.webp", "/samples/solstice-silver.webp"],
    variants: { gold: 11, silver: 11 },
    soldCount: 72,
  },
  {
    name: "Twisted Band Ring",
    slug: "twisted-band-ring",
    description: "Two intertwined bands for a sculptural, stackable ring with a soft sheen.",
    price: 480,
    categories: ["rings"],
    tags: [],
    images: ["/samples/twist-rose.webp", "/samples/twist-gold.webp"],
    variants: { "rose-gold": 8, gold: 2 },
    soldCount: 18,
  },
  {
    name: "Pearl Drop Earrings",
    slug: "pearl-drop-earrings",
    description: "Lustrous freshwater-style pearls hanging from fine hooks, timeless from day to evening.",
    price: 720,
    categories: ["earrings"],
    tags: ["NEW"],
    images: ["/samples/pearl-gold.webp", "/samples/pearl-silver.webp"],
    variants: { gold: 9, silver: 6 },
    soldCount: 25,
  },
  {
    name: "Mini Hoop Earrings",
    slug: "mini-hoop-earrings",
    description: "Chunky mini hoops with a comfortable click-shut closure. The pair you'll never take off.",
    price: 540,
    compareAtPrice: 650,
    categories: ["earrings"],
    tags: ["BEST_SELLER", "SALE"],
    images: ["/samples/hoops-gold.webp", "/samples/hoops-silver.webp", "/samples/hoops-rose.webp"],
    variants: { gold: 18, silver: 12, "rose-gold": 7 },
    soldCount: 95,
  },
  {
    name: "Classic Tennis Bracelet",
    slug: "classic-tennis-bracelet",
    description: "A continuous line of brilliant crystals in secure settings. 17 cm with a 2 cm extender.",
    price: 1350,
    categories: ["bracelets"],
    tags: ["BEST_SELLER"],
    images: ["/samples/tennis-silver.webp", "/samples/tennis-gold.webp"],
    variants: { silver: 8, gold: 6 },
    soldCount: 44,
  },
  {
    name: "Cuban Link Bracelet",
    slug: "cuban-link-bracelet",
    description: "A bold, polished Cuban link with a secure box clasp. Wear it alone or stack it.",
    price: 890,
    categories: ["bracelets"],
    tags: ["NEW"],
    images: ["/samples/cuban-gold.webp", "/samples/cuban-silver.webp"],
    variants: { gold: 10, silver: 10 },
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
      { product: "aurelia-pendant-necklace", color: "gold" as ColorSlug },
      { product: "mini-hoop-earrings", color: "gold" as ColorSlug },
      { product: "cuban-link-bracelet", color: "gold" as ColorSlug },
    ],
  },
  {
    name: "Rosé Keepsake Box",
    slug: "rose-keepsake-box",
    description: "A romantic trio in rose gold: the Nile hand chain, Initial Heart charm and Twisted Band ring. Gift-wrapped and ready to give.",
    coverImage: "/samples/giftbox-rose.webp",
    price: 1450,
    items: [
      { product: "nile-hand-chain", color: "rose-gold" as ColorSlug },
      { product: "initial-heart-charm", color: "rose-gold" as ColorSlug },
      { product: "twisted-band-ring", color: "rose-gold" as ColorSlug },
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

  // Colors
  const colorIds: Record<string, string> = {};
  for (const [i, c] of COLORS.entries()) {
    const color = await db.color.upsert({ where: { slug: c.slug }, create: { ...c, sortOrder: i }, update: {} });
    colorIds[c.slug] = color.id;
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
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
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
          create: Object.entries(p.variants).map(([color, stock]) => ({ colorId: colorIds[color], stock: stock! })),
        },
      },
    });
  }

  // Gift boxes
  for (const box of GIFT_BOXES) {
    if (await db.giftBox.findUnique({ where: { slug: box.slug } })) continue;
    const items = [];
    for (const item of box.items) {
      const variant = await db.variant.findFirst({ where: { color: { slug: item.color }, product: { slug: item.product } } });
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
