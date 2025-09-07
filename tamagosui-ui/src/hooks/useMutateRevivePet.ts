import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";

// Ganti dengan Package ID Anda yang sebenarnya
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export function useMutateRevivePet() {
    const queryClient = useQueryClient();
    const { mutateAsync } = useSignAndExecuteTransaction();

    return useMutation({
        mutationFn: async ({ petId }: { petId: string }) => {
            if (!PACKAGE_ID) throw new Error("Package ID tidak ditemukan");

            const txb = new Transaction();

            txb.moveCall({
                target: `${PACKAGE_ID}::tamagosui::revive_pet`,
                arguments: [txb.object(petId)],
            });

            // Eksekusi transaksi
            return mutateAsync({
                transaction: txb,
                // options: { showEffects: true }, // Uncomment jika perlu
            });
        },
        onSuccess: (data, variables) => {
        // 'data' adalah hasil yang dikembalikan dari fungsi mutasi jika berhasil
        console.log("Mutasi berhasil dengan data:", data);
        console.log("Variabel yang digunakan:", variables);

        toast.success("Peliharaanmu telah hidup kembali! ✨");

        // Invalidate query untuk memicu pengambilan data ulang
        queryClient.invalidateQueries({
            queryKey: ["pet", variables.petId], 
        });
        },
        onError: (error: any) => {
            toast.error("Gagal menghidupkan kembali peliharaanmu. Pastikan koinmu 0.");
            console.error("Gagal menghidupkan pet:", error);
        },
    });
}
