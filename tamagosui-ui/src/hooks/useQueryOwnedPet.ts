// Lokasi file: src/hooks/useQueryOwnedPet.ts

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions"; // BARU: Impor TransactionBlock
import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { normalizeSuiPetObject } from "@/lib/utils";

export const queryKeyOwnedPet = (address?: string) => {
  if (address) return ["owned-pet", address];
  return ["owned-pet"];
};

export function useQueryOwnedPet() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: queryKeyOwnedPet(currentAccount?.address),
    queryFn: async () => {
      if (!currentAccount) throw new Error("No connected account");

      // Langkah 1: Dapatkan objek Pet (kode Anda sudah benar)
      const petResponse = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::Pet` },
        options: { showContent: true },
      });

      if (petResponse.data.length === 0) return null;

      const petObject = petResponse.data[0];
      const normalizedPet = normalizeSuiPetObject(petObject);

      if (!normalizedPet) return null;

      // Langkah 2 (MODIFIKASI): Lakukan 2 panggilan ke blockchain secara bersamaan untuk efisiensi
      // Panggilan 1: Dapatkan dynamic fields untuk cek status tidur
      // Panggilan 2: Panggil view function 'is_dead'
      const [dynamicFields, isDeadInspectResult] = await Promise.all([
        suiClient.getDynamicFields({ parentId: normalizedPet.id }),
        (() => {
          const txb = new Transaction();
          txb.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::is_dead`,
            arguments: [txb.object(normalizedPet.id)],
          });
          return suiClient.devInspectTransactionBlock({
            sender: currentAccount.address,
            transactionBlock: txb,
          });
        })(),
      ]);

      // Langkah 3 (MODIFIKASI): Proses hasil dari kedua panggilan
      // Cek status tidur dari hasil panggilan pertama
      const isSleeping = dynamicFields.data.some(
        (field) =>
          field.name.type === "0x1::string::String" &&
          field.name.value === "sleep_started_at",
      );

      // Ambil status 'is_dead' dari hasil panggilan kedua
      const isDeadReturnValue = isDeadInspectResult.results?.[0]?.returnValues?.[0];
      const isDead = isDeadReturnValue ? isDeadReturnValue[0][0] === 1 : false;

      // Langkah 4 (MODIFIKASI): Kembalikan objek gabungan yang sudah lengkap
      return {
        ...normalizedPet,
        isSleeping,
        is_dead: isDead, // <-- Properti yang hilang sekarang sudah ditambahkan
      };
    },
    enabled: !!currentAccount,
  });
}