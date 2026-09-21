-- O pagamento passa a guardar o valor pago (informado pelo membro).
-- Os pagamentos existentes não têm valor; o banco é de teste, então são apagados
-- para a coluna poder nascer obrigatória.
DELETE FROM "group_payments";

-- AlterTable
ALTER TABLE "group_payments" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;
