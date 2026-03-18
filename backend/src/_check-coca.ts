import { db } from "./db/index.js";
import { products } from "./db/schema/index.js";
import { eq } from "drizzle-orm";

async function main() {
  const p = await db.query.products.findFirst({ where: eq(products.barcode, "5449000054227") });
  if (!p) { console.log("NOT FOUND"); process.exit(); }

  console.log("=== Product ===");
  console.log("name:", p.name);
  console.log("brand:", p.brand);
  console.log("category (col):", p.category);
  console.log("nutriscoreGrade (col):", p.nutriscoreGrade);
  console.log("novaGroup (col):", p.novaGroup);
  console.log("additivesTags:", JSON.stringify(p.additivesTags));

  const off = p.offData as Record<string, unknown> | null;
  if (off) {
    console.log("\n=== offData keys ===");
    console.log(Object.keys(off).sort().join(", "));
    console.log("\noffData.categories:", off.categories);
    console.log("offData.nutriscore_grade:", off.nutriscore_grade);
    console.log("offData.nova_group:", off.nova_group);

    const nut = off.nutriments as Record<string, unknown> | undefined;
    if (nut) {
      console.log("\n=== offData.nutriments ===");
      console.log("energy-kcal_100g:", nut["energy-kcal_100g"]);
      console.log("sugars_100g:", nut["sugars_100g"]);
      console.log("fat_100g:", nut["fat_100g"]);
      console.log("saturated-fat_100g:", nut["saturated-fat_100g"]);
      console.log("salt_100g:", nut["salt_100g"]);
      console.log("proteins_100g:", nut["proteins_100g"]);
    } else {
      console.log("NO nutriments in offData!");
    }
  } else {
    console.log("NO offData!");
  }

  process.exit();
}
main();
