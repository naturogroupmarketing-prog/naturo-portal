import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // States
  const nsw = await prisma.state.upsert({
    where: { name: "New South Wales" },
    update: {},
    create: { name: "New South Wales" },
  });
  const vic = await prisma.state.upsert({
    where: { name: "Victoria" },
    update: {},
    create: { name: "Victoria" },
  });
  const qld = await prisma.state.upsert({
    where: { name: "Queensland" },
    update: {},
    create: { name: "Queensland" },
  });

  // Regions
  const sydneyMetro = await prisma.region.upsert({
    where: { name_stateId: { name: "Sydney Metro", stateId: nsw.id } },
    update: {},
    create: { name: "Sydney Metro", stateId: nsw.id },
  });
  const melbMetro = await prisma.region.upsert({
    where: { name_stateId: { name: "Melbourne Metro", stateId: vic.id } },
    update: {},
    create: { name: "Melbourne Metro", stateId: vic.id },
  });
  const brisbaneMetro = await prisma.region.upsert({
    where: { name_stateId: { name: "Brisbane Metro", stateId: qld.id } },
    update: {},
    create: { name: "Brisbane Metro", stateId: qld.id },
  });

  // Branches
  const parramatta = await prisma.branch.upsert({
    where: { name_regionId: { name: "Parramatta", regionId: sydneyMetro.id } },
    update: {},
    create: { name: "Parramatta", address: "100 George St, Parramatta NSW 2150", regionId: sydneyMetro.id },
  });
  const chatswood = await prisma.branch.upsert({
    where: { name_regionId: { name: "Chatswood", regionId: sydneyMetro.id } },
    update: {},
    create: { name: "Chatswood", address: "50 Victoria Ave, Chatswood NSW 2067", regionId: sydneyMetro.id },
  });
  const richmond = await prisma.branch.upsert({
    where: { name_regionId: { name: "Richmond", regionId: melbMetro.id } },
    update: {},
    create: { name: "Richmond", address: "200 Bridge Rd, Richmond VIC 3121", regionId: melbMetro.id },
  });
  const southBank = await prisma.branch.upsert({
    where: { name_regionId: { name: "South Bank", regionId: brisbaneMetro.id } },
    update: {},
    create: { name: "South Bank", address: "10 Grey St, South Brisbane QLD 4101", regionId: brisbaneMetro.id },
  });

  // Storage Rooms
  const parraMain = await prisma.storageRoom.upsert({
    where: { name_branchId: { name: "Main Store", branchId: parramatta.id } },
    update: {},
    create: { name: "Main Store", branchId: parramatta.id },
  });
  const parraClean = await prisma.storageRoom.upsert({
    where: { name_branchId: { name: "Cleaning Cupboard", branchId: parramatta.id } },
    update: {},
    create: { name: "Cleaning Cupboard", branchId: parramatta.id },
  });
  const chatswoodMain = await prisma.storageRoom.upsert({
    where: { name_branchId: { name: "Main Store", branchId: chatswood.id } },
    update: {},
    create: { name: "Main Store", branchId: chatswood.id },
  });
  const richmondMain = await prisma.storageRoom.upsert({
    where: { name_branchId: { name: "Main Store", branchId: richmond.id } },
    update: {},
    create: { name: "Main Store", branchId: richmond.id },
  });
  const southBankMain = await prisma.storageRoom.upsert({
    where: { name_branchId: { name: "Main Store", branchId: southBank.id } },
    update: {},
    create: { name: "Main Store", branchId: southBank.id },
  });

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@naturogroup.com.au" },
    update: {},
    create: {
      email: "admin@naturogroup.com.au",
      name: "Admin User",
      role: "SUPER_ADMIN",
      branchId: parramatta.id,
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: "manager.parra@naturogroup.com.au" },
    update: {},
    create: {
      email: "manager.parra@naturogroup.com.au",
      name: "Sarah Wilson",
      role: "BRANCH_MANAGER",
      branchId: parramatta.id,
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: "john.doe@naturogroup.com.au" },
    update: {},
    create: {
      email: "john.doe@naturogroup.com.au",
      name: "John Doe",
      role: "STAFF",
      branchId: parramatta.id,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "jane.smith@naturogroup.com.au" },
    update: {},
    create: {
      email: "jane.smith@naturogroup.com.au",
      name: "Jane Smith",
      role: "STAFF",
      branchId: parramatta.id,
    },
  });

  // Assets
  const assets = [
    { assetCode: "NAT-VAC-001", name: "Dyson V15 Detect", category: "Vacuum Cleaner", storageRoomId: parraMain.id, isHighValue: true, purchaseCost: 1199.00, supplier: "Dyson Australia" },
    { assetCode: "NAT-VAC-002", name: "Karcher WD 6", category: "Vacuum Cleaner", storageRoomId: parraMain.id, isHighValue: false, purchaseCost: 549.00, supplier: "Karcher" },
    { assetCode: "NAT-MOP-001", name: "Vileda ProMist Max", category: "Mop System", storageRoomId: parraClean.id, isHighValue: false, purchaseCost: 89.00 },
    { assetCode: "NAT-KEY-001", name: "Master Key Set - Parramatta", category: "Keys", storageRoomId: parraMain.id, isHighValue: true },
    { assetCode: "NAT-PHN-001", name: "Samsung Galaxy A15", category: "Phone", storageRoomId: parraMain.id, isHighValue: true, purchaseCost: 329.00, supplier: "Samsung" },
    { assetCode: "NAT-TUB-001", name: "Cleaning Tub System A", category: "Cleaning Tub", storageRoomId: chatswoodMain.id, isHighValue: false, purchaseCost: 120.00 },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { assetCode: asset.assetCode },
      update: {},
      create: {
        ...asset,
        status: "AVAILABLE",
        qrCodeData: null,
      },
    });
  }

  // Consumables
  const consumables = [
    { name: "All-Purpose Cleaner", category: "Chemicals", unitType: "bottles", quantityOnHand: 24, minimumThreshold: 5, reorderLevel: 10, storageRoomId: parraClean.id, supplier: "CleanCo" },
    { name: "Blue Microfiber Cloths", category: "Cloths", unitType: "packs", quantityOnHand: 8, minimumThreshold: 3, reorderLevel: 6, storageRoomId: parraClean.id },
    { name: "Large Bin Liners (80L)", category: "Bin Liners", unitType: "rolls", quantityOnHand: 15, minimumThreshold: 5, reorderLevel: 10, storageRoomId: parraClean.id },
    { name: "Nitrile Gloves (M)", category: "Gloves", unitType: "boxes", quantityOnHand: 3, minimumThreshold: 5, reorderLevel: 10, storageRoomId: parraClean.id },
    { name: "Paper Towels", category: "Paper Products", unitType: "cartons", quantityOnHand: 12, minimumThreshold: 4, reorderLevel: 8, storageRoomId: parraClean.id },
    { name: "Mop Head Replacement", category: "Mop Heads", unitType: "units", quantityOnHand: 6, minimumThreshold: 2, reorderLevel: 5, storageRoomId: parraClean.id },
    { name: "Glass Cleaner", category: "Chemicals", unitType: "bottles", quantityOnHand: 10, minimumThreshold: 3, reorderLevel: 6, storageRoomId: chatswoodMain.id, supplier: "CleanCo" },
  ];

  for (const c of consumables) {
    await prisma.consumable.upsert({
      where: { name_storageRoomId: { name: c.name, storageRoomId: c.storageRoomId } },
      update: {},
      create: c,
    });
  }

  console.log("Seed completed successfully!");
  console.log(`  States: 3`);
  console.log(`  Regions: 3`);
  console.log(`  Branches: 4`);
  console.log(`  Storage Rooms: 5`);
  console.log(`  Users: 4`);
  console.log(`  Assets: ${assets.length}`);
  console.log(`  Consumables: ${consumables.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
