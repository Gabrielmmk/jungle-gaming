import { describe, it, expect } from "vitest";
import { nftSchema, listNftsParamsSchema, listNftsResponseSchema } from "@/contracts/nft";
describe("nft contract (estendido)", () => {
  it("aceita NFT completo com os novos campos", () => {
    const nft = { id:"1", name:"Emerald Ape #842", image:"/a.png", images:["/a.png","/b.png"],
      collection:"Kurio Apes", category:"Collectibles", network:"Ethereum", priceEth:"1.19",
      available:16, version:1, description:"desc", editionMinted:1, editionTotal:16,
      ratingAvg:4.6, ratingCount:19, format:"PNG", contractAddress:"0xabc", royaltiesPct:"5" };
    expect(nftSchema.parse(nft).network).toBe("Ethereum");
  });
  it("params aceitam multi-filtros e faixa de preço", () => {
    const p = listNftsParamsSchema.parse({ categories:["Music","Gaming"], networks:["Ethereum"], minPrice:"0.1", maxPrice:"5", page:1 });
    expect(p.categories).toEqual(["Music","Gaming"]); expect(p.maxPrice).toBe("5");
  });
  it("response inclui facets", () => {
    const r = listNftsResponseSchema.parse({ items:[], total:0, page:1, pageSize:12, facets:{ categories:{Music:3}, networks:{Ethereum:10} } });
    expect(r.facets.categories.Music).toBe(3);
  });
});
