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
        onSuccess: (data, variables) => {
            // 'data' adalah respons dari API jika sukses
            console.log("Mutasi untuk menerima koin berhasil:", data);

            toast.success("Kamu menerima 10 koin! 🪙");

            // Poin Penting: Pastikan queryKey yang di-refresh sudah sesuai.
            // Apakah data koin ada di dalam data 'user' atau 'pet'?

            // Opsi 1: Jika data koin ada di data user/profile (paling umum)
            queryClient.invalidateQueries({
                queryKey: ["userProfile"], // atau ["userData"], sesuaikan dengan key Anda
            });

            // Opsi 2: Jika data koin menempel di data pet
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