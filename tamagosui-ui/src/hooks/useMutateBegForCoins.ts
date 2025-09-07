import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

// Ganti dengan Package ID Anda yang sebenarnya
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export function useMutateBegForCoins() {
    const queryClient = useQueryClient();
    const { mutateAsync } = useSignAndExecuteTransaction();

    return useMutation({
        mutationFn: async ({ petId }: { petId: string }) => {
            if (!PACKAGE_ID) throw new Error("Package ID tidak ditemukan");

            const txb = new Transaction();

            txb.moveCall({
                target: `${PACKAGE_ID}::tamagosui::beg_for_coins`,
                arguments: [txb.object(petId)],
            });

            // Eksekusi transaksi
            return mutateAsync({
                transaction: txb,
                // options: { showEffects: true }, // Uncomment jika perlu
            });
        },
        onSuccess: (result, variables) => {
            toast.success("Kamu menerima 10 koin! 🪙");
            // Refresh data pet
            queryClient.invalidateQueries({
                queryKey: ["pet", variables.petId],
            });
        },
        onError: (error: any) => {
            toast.error("Gagal meminta koin. Pastikan koinmu benar-benar habis.");
            console.error("Gagal meminta koin:", error);
        },
    });
}